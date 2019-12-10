class SerializableDataset < BaseJsonSerializer
  type 'datasets'
  attributes(
    :chart_type, # see below TODO
    :identifier,
    :timeframe,
    :measure,
    :name,
    :max_domain,
    :question_type,
    :total,
    :data,
    :single_value,
    :order,
    :selected,
    :data_items_datasets_id,
    :test_collection_id,
    :data_source_id,
    :data_source_type,
    :groupings,
    :tiers,
    :style,
  )

  belongs_to :data_source
end
