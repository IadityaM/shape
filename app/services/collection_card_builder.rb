class CollectionCardBuilder
  attr_reader :collection_card, :errors

  def initialize(params:, parent_collection:, user: nil, type: 'primary')
    @datasets_params = params.try(:[], :item_attributes).try(:[], :datasets_attributes)
    @params = params
    @parent_collection = parent_collection
    @params[:order] ||= next_card_order
    unless parent_collection.is_a? Collection::Board
      # row and col can come from GridCardHotspot, but we nullify for non-Boards
      @params.delete :row
      @params.delete :col
    end
    @collection_card = parent_collection.send("#{type}_collection_cards").build(@params)
    @errors = @collection_card.errors
    @user = user
  end

  def self.call(*args)
    service = new(*args)
    service.create
    service.collection_card
  end

  def create
    hide_helper_for_user
    if @collection_card.record.present?
      # capture this here before `save` is called at which point the accessor will be nil
      @external_id = @collection_card.record.external_id
      create_collection_card
    else
      @collection_card.errors.add(:record, "can't be blank")
      false
    end
  end

  private

  def next_card_order
    @parent_collection.card_order_at('end')
  end

  def hide_helper_for_user
    # if the user has "show_helper" then set it to false, now that they've created a card
    return unless @user.try(:show_helper)

    @user.update(show_helper: false)
  end

  def create_collection_card
    # NOTE: cards created inside a master_template are unpinned by default unless it's being created within a pinned area
    @collection_card.pinned = true if @parent_collection.should_pin_cards? @collection_card.order
    @parent_collection.transaction do
      # NOTE: Have to lock board collections for collision detection race conditions.
      #  This means that uploading 6 files at once for example will be threadsafe,
      #  but it will slow down each concurrent API request while it waits for the lock
      @parent_collection.lock! if @parent_collection.board_collection?

      if @parent_collection.board_collection? && !@collection_card.board_placement_is_valid?
        # valid row/col will get applied to the card here for later saving
        CollectionGrid::BoardPlacement.call(
          row: @collection_card.row,
          col: @collection_card.col,
          to_collection: @parent_collection,
          moving_cards: [@collection_card],
        )
      end

      @collection_card.save.tap do |result|
        return false unless result

        post_creation_record_update if @collection_card.primary?

        @collection_card.increment_card_orders!
        @parent_collection.reorder_cards!

        if @parent_collection.master_template?
          # we just added a template card, so update the instances
          @parent_collection.queue_update_template_instances(
            updated_card_ids: [@collection_card.id],
            template_update_action: 'create',
          )
        end

        create_datasets if @datasets_params.present?
      end
    end
  end

  def post_creation_record_update
    record = @collection_card.record
    record.inherit_roles_anchor_from_parent!
    if @collection_card.record_type == :collection
      # NOTE: should items created in My Collection get this access as well?
      # this will change the roles_anchor, which will get re-cached later
      record.enable_org_view_access_if_allowed
      update_params = {}
      if @user.present?
        update_params[:created_by] = @user
      end
      if record.parent.anyone_can_view?
        update_params[:anyone_can_view] = true
      end
      record.update(update_params)
    end

    # Need to trickle down for all C∆ "app" subcollections
    if @parent_collection.inside_a_creative_difference_collection?
      @collection_card.update(filter: 'nothing', font_color: '#120F0E')
    end

    @collection_card.parent.cache_cover! if @collection_card.should_update_parent_collection_cover?
    @collection_card.update_collection_cover if @collection_card.is_cover
    add_external_record
    record.reload
    # will also cache roles identifier and update breadcrumb
    record.save

    if record.is_a?(Item::FileItem) && record.video?
      record.transcode!
    end

    # If this is a live test collection...
    if @parent_collection.test_collection? &&
       @parent_collection.live_or_was_launched? &&
       @parent_collection.test_results_collection.present? &&
       record.is_a?(Item::QuestionItem)

      TestResultsCollection::CreateContentWorker.perform_async(@parent_collection.test_results_collection.id, @user.id)
    end

    return unless @parent_collection.is_a? Collection::SubmissionsCollection

    @parent_collection.follow_submission_box(@user)
    record.unanchor_and_inherit_roles_from_anchor!
    @user.add_role(Role::EDITOR, record)
  end

  def add_external_record
    return unless @external_id.present? && @user.application.present?

    @collection_card.record.add_external_id(
      @external_id,
      @user.application.id,
    )
  end

  def create_datasets
    @datasets_params.to_h.values.each do |dataset_params|
      @collection_card.item.create_dataset(dataset_params)
    end
  end

  def capture_error_and_rollback(error)
    @errors << error
    raise ActiveRecord::Rollback
  end
end
