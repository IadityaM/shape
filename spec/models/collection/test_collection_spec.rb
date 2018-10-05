require 'rails_helper'

describe Collection::TestCollection, type: :model do
  let(:test_collection) { create(:test_collection) }

  context 'associations' do
    it { should have_many :survey_responses }
    it { should have_many :prelaunch_question_items }
    it { should have_one :test_design }
  end

  context 'callbacks' do
    describe '#setup_default_status_and_questions' do
      it 'should set the test_status to "draft"' do
        expect(test_collection.test_status).to eq 'draft'
      end

      it 'should create the default setup with its attached cards and items' do
        expect(test_collection.collection_cards.count).to eq 4
        expect(test_collection.items.count).to eq 4
      end
    end

    describe '#add_test_tag' do
      it 'should add the #test tag after_create' do
        expect(test_collection.cached_owned_tag_list).to match_array(['test'])
      end
    end
  end

  describe '#create_uniq_survey_response' do
    it 'should create a survey response with a unique session_uid' do
      expect {
        test_collection.create_uniq_survey_response
      }.to change(test_collection.survey_responses, :count).by(1)
      expect(test_collection.survey_responses.last.session_uid).not_to be nil
    end
  end

  context 'launching a test' do
    let(:user) { create(:user) }

    describe '#launch!' do
      context 'with valid draft collection (default status)' do
        it 'should create a TestDesign collection and move the questions into it' do
          expect(test_collection.test_design.present?).to be false
          expect(test_collection.launch!(initiated_by: user)).to be true
          expect(test_collection.test_design.created_by).to eq user
          expect(test_collection.test_design.present?).to be true
          # should have moved the default question cards into there
          expect(
            test_collection
            .test_design
            .collection_cards
            .map(&:card_question_type)
            .map(&:to_sym),
          ).to eq(
            Collection::TestCollection.default_question_types,
          )
          expect(
            test_collection.test_design.collection_cards.map(&:order),
          ).to eq([0, 1, 2, 3])
          # now the test_collection should have the test design and chart item
          expect(
            test_collection
            .collection_cards
            .reload
            .map { |card| card.record.class },
          ).to match_array(
            [
              Collection::TestDesign,
              Item::ChartItem,
            ]
          )
        end

        it 'should update the status to "live"' do
          expect(test_collection.launch!(initiated_by: user)).to be true
          expect(test_collection.live?).to be true
        end

        it 'should create a chart item for each scale question' do
            expect {
              test_collection.launch!(initiated_by: user)
            }.to change(
              Item::ChartItem, :count
            ).by(test_collection.question_items.select { |q| q.question_context? || q.question_useful? }.size)
        end

        context 'with open response questions' do
          let!(:test_collection) { create(:test_collection, :open_response_questions) }

          it 'creates a TestOpenResponse collection for each item' do
            expect {
              test_collection.launch!(initiated_by: user)
            }.to change(
              Collection::TestOpenResponses, :count
            ).by(test_collection.question_items.size)

            expect(
              test_collection
                .test_design
                .question_items
                .all?(&:test_open_responses_collection),
            ).to be true
          end
        end
      end

      context 'with invalid collection' do
        before do
          # the before_create sets it as draft, so we do this after creation
          test_collection.update(test_status: :live)
        end

        it 'returns false with test_status errors' do
          expect(test_collection.launch!(initiated_by: user)).to be false
          expect(test_collection.errors).to match_array(["Test status event 'launch' cannot transition from 'live'."])
        end
      end
    end

    describe '#close!' do
      before do
        test_collection.launch!(initiated_by: user)
      end

      it 'should set status as closed' do
        expect(test_collection.close!).to be true
        expect(test_collection.closed?).to be true
      end
    end

    describe '#reopen!' do
      before do
        test_collection.launch!(initiated_by: user)
        test_collection.close!
      end

      it 'should set status as live' do
        expect(test_collection.reopen!).to be true
        expect(test_collection.live?).to be true
      end
    end

    describe '#serialized_for_test_survey' do
      before do
        test_collection.launch!(initiated_by: user)
      end

      it 'should output its collection_cards from the test_design child collection' do
        data = test_collection.serialized_for_test_survey
        card_ids = test_collection.test_design.collection_cards.map(&:id).map(&:to_s)
        expect(data[:data][:relationships][:collection_cards][:data].map{ |i| i[:id] }).to match_array(card_ids)
      end
    end
  end
end
