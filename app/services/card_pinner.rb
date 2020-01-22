class CardPinner < SimpleService
  def initialize(card:, pinning:)
    @card = card
    @pinning = pinning
  end

  def call
    reorder_cards!
  end

  def reorder_cards!
    template = @card.parent

    next_to_last_pinned_order = (template.collection_cards.pinned&.last&.order || -1) + 1
    @card.update(pinned: @pinning, order: next_to_last_pinned_order)

    # we just pinned a template card, so update the instances
    template.queue_update_template_instances(
      updated_card_ids: [@card.id],
      template_update_action: 'pin',
    )

    template.reorder_cards!
    template.reload
  end
end
