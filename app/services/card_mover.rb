class CardMover
  attr_reader :errors
  attr_reader :moving_cards

  def initialize(
    from_collection:,
    to_collection:,
    cards:,
    placement: 'beginning',
    card_action: 'move' # 'move' or 'link'
  )
    @from_collection = from_collection
    @to_collection = to_collection
    @placement = placement
    @card_action = card_action
    @should_update_from_cover = false
    # retain array of cards being moved
    @moving_cards = cards.to_a
    @existing_cards = []
    @pinned_cards = []
    @to_collection_cards = []
    @legend_items_to_duplicate = []
    @errors = []
  end

  def call
    return false if to_collection_invalid
    select_existing_cards
    select_pinned_cards
    select_to_collection_cards
    include_legends_in_to_collection_cards
    duplicate_or_link_legend_items
    move_cards_to_collection
    recalculate_cached_values
    update_template_instances
    assign_permissions
    @moving_cards
  end

  private

  def move?
    @card_action == 'move'
  end

  def link?
    @card_action == 'link'
  end

  def select_existing_cards
    cards = @to_collection.collection_cards
    cards = cards.unpinned unless @to_collection.master_template?
    @existing_cards = cards.to_a
  end

  def select_pinned_cards
    # for moving cards in a master template, all cards are pinned;
    # so we don't need to "lock" the existing pinned cards to the front
    return if @to_collection.master_template?
    @pinned_cards = @to_collection.collection_cards.pinned.to_a
  end

  def select_to_collection_cards
    if move?
      # minus any we're moving (i.e. moving within the same collection)
      @existing_cards.reject! { |card| @moving_cards.include? card }
      unless @to_collection == @from_collection
        @should_update_from_cover = @moving_cards.any?(&:should_update_parent_collection_cover?)
      end
    elsif link?
      # for links, we build new link cards out of our selected moving ones
      @moving_cards = @moving_cards.map(&:copy_into_new_link_card)
    end

    # created joined array with moving_cards either at beginning or end
    if @placement == 'beginning'
      @to_collection_cards = (@pinned_cards + @moving_cards + @existing_cards)
    else
      @to_collection_cards = (@pinned_cards + @existing_cards + @moving_cards)
    end

    # uniq the array because we may be moving within the same collection
    @to_collection_cards.uniq!
  end

  def move_cards_to_collection
    # Reorder all cards based on order of joined_cards
    @to_collection_cards.map.with_index do |card, i|
      # parent_id will already be set for existing_cards but no harm to indicate
      card.assign_attributes(parent_id: @to_collection.id, order: i)
      if @to_collection.master_template?
        # Currently any cards created in master_templates become pinned
        card.assign_attributes(pinned: true)
      end
      if card.changed?
        @should_update_to_cover ||= card.should_update_parent_collection_cover?
        card.save
      end
      card
    end
  end

  def recalculate_cached_values
    unless link? || @from_collection == @to_collection
      @from_collection.touch
      @from_collection.reload.reorder_cards!
      @from_collection.cache_card_count!
    end
    @from_collection.cache_cover! if @should_update_from_cover
    @to_collection.cache_cover! if @should_update_to_cover
    @to_collection.recalculate_child_breadcrumbs(@moving_cards)
    @to_collection.cache_card_count!
  end

  def update_template_instances
    @from_collection.queue_update_template_instances if @from_collection.master_template?
    @to_collection.queue_update_template_instances if @to_collection.master_template?
  end

  def to_collection_data_items
    @to_collection_cards.select do |card|
      card.item&.is_a?(Item::DataItem)
    end.map(&:item)
  end

  def to_collection_legend_items
    @to_collection_cards.select do |card|
      card.item.is_a?(Item::LegendItem)
    end.map(&:item)
  end

  # If they are moving a data item that has a legend,
  # but haven't selected the legend, move it as well
  def include_legends_in_to_collection_cards
    all_data_item_legends = to_collection_data_items.map(&:legend_item).compact
    legends_missing = all_data_item_legends - to_collection_legend_items

    # Return because all linked legends are included in the `to_collection`
    return if legends_missing.blank?

    to_collection_data_item_ids = to_collection_data_items.map(&:id)

    # Include any legends that are missing
    legends_missing.each do |legend_item|
      # If the legend is only linked to data items in `to_collection`, move it
      if (legend_item.data_item_ids - to_collection_data_item_ids).size.zero?
        @moving_cards.push(legend_item.parent_collection_card)
        @to_collection_cards.push(legend_item.parent_collection_card)
      else
        # Otherwise we need to create a new legend
        @legend_items_to_duplicate.push(legend_item)
      end
    end
  end

  def duplicate_or_link_legend_items
    return if @legend_items_to_duplicate.blank?

    @legend_items_to_duplicate.each do |legend_item|
      if move?
        duplicate = legend_item.duplicate!(
          for_user: nil,
          copy_parent_card: true,
          parent: @to_collection,
          system_collection: false,
          synchronous: true,
        )
        if duplicate.persisted?
          # Connect to all data items it was connected to
          # Only including data items now in the `to_collection`
          add_to_data_items = to_collection_data_items & legend_item.data_items
          add_to_data_items.each do |data_item|
            data_item.update(legend_item: duplicate)
          end
        else
          @errors << "Could not copy legend: #{duplicate.errors.full_messages.join('. ')}"
        end
      elsif link?
        linked_card = legend_item.parent_collection_card.copy_into_new_link_card
        @moved_cards.push(linked_card)
        @to_collection_cards.push(linked_card)
      end
    end
  end

  def to_collection_invalid
    # these only apply for moving actions
    return unless move?
    # Not allowed to move between organizations
    if @to_collection.organization_id != @from_collection.organization_id
      @errors << 'You can\'t move a collection to a different organization.'
      return true
    end
    # NOTE: recalculate_breadcrumb! probably unnecessary; just to be safe
    @to_collection.recalculate_breadcrumb!
    @from_collection.recalculate_breadcrumb!
    @moving_cards.each do |card|
      collection = card.collection
      next unless collection.present?
      if @to_collection.within_collection_or_self?(collection)
        @errors << 'You can\'t move a collection inside of itself.'
        return true
      end
      if @to_collection.inside_a_master_template? && collection.any_template_instance_children?
        @errors << 'You can\'t move an instance of a template inside a master template.'
        return true
      end
    end
    false
  end

  def assign_permissions
    return if @to_collection == @from_collection
    return unless move?
    @moving_cards.each do |card|
      Roles::MergeToChild.call(parent: @to_collection, child: card.record)
    end
  end
end
