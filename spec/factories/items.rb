FactoryBot.define do
  factory :item do
    transient do
      parent_collection nil
      add_editors []
      add_viewers []
    end

    name { Faker::Food.dish }

    factory :text_item, class: 'Item::TextItem' do
      content { Faker::BackToTheFuture.quote }
      data_content { { ops: [{ insert: 'Hola, world.' }] } }
    end

    factory :link_item, class: 'Item::LinkItem' do
      content { Faker::BackToTheFuture.quote }
      url { Faker::Internet.url('example.com') }
    end

    factory :file_item, class: 'Item::FileItem' do
      name nil # name gets generated by filestack_file
      filestack_file
    end

    factory :pdf_file_item, class: 'Item::FileItem' do
      name nil # name gets generated by filestack_file
      filestack_file factory: :filestack_pdf_file
    end

    factory :video_item, class: 'Item::VideoItem' do
      url 'https://www.youtube.com/watch?v=igJ4qADrSwo'
      thumbnail_url { Faker::Company.logo }
      name '80s Best Dance Hits'
    end

    factory :question_item, class: 'Item::QuestionItem' do
      question_type :question_useful
    end

    factory :data_item, class: 'Item::DataItem' do
      transient do
        dataset_type :cached_data
      end

      trait :report_type_collections_and_items do
        report_type :report_type_collections_and_items
        dataset_type :collections_and_items
      end

      trait :report_type_network_app_metric do
        report_type :report_type_network_app_metric
        dataset_type :network_app_metric
      end

      trait :report_type_record do
        report_type :report_type_record
        dataset_type :cached_data
      end

      trait :report_type_question_item do
        report_type :report_type_question_item
        dataset_type :question_item
      end

      after(:build) do |data_item, evaluator|
        if evaluator.dataset_type.present?
          data_item.data_items_datasets << build_list(
            :data_items_dataset, 1, evaluator.dataset_type, data_item: data_item
          )
        end
      end
    end

    factory :legend_item, class: 'Item::LegendItem'

    after(:build) do |item, evaluator|
      if evaluator.parent_collection
        item.parent_collection_card = build(
          :collection_card,
          parent: evaluator.parent_collection,
          order: evaluator.parent_collection.collection_cards.count,
          width: 1,
          height: 1,
        )
      end
    end

    after(:create) do |item, evaluator|
      if evaluator.add_editors.present?
        item.unanchor_and_inherit_roles_from_anchor!
        evaluator.add_editors.each do |user|
          user.add_role(Role::EDITOR, item.becomes(Item))
        end
      end

      if evaluator.add_viewers.present?
        item.unanchor_and_inherit_roles_from_anchor!
        evaluator.add_viewers.each do |user|
          user.add_role(Role::VIEWER, item.becomes(Item))
        end
      end
    end
  end
end
