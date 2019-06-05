require 'rails_helper'

RSpec.describe SurveyResponse, type: :model do
  context 'associations' do
    it { should belong_to(:test_collection) }
    it { should belong_to(:user) }
    it { should have_many(:question_answers) }
    it { should have_one(:feedback_incentive_record) }
  end

  describe 'callbacks' do
    describe '#create_open_response_items' do
      let!(:test_collection) { create(:test_collection, :open_response_questions) }
      let!(:survey_response) { create(:survey_response, test_collection: test_collection) }
      let(:author) { create(:user) }

      before do
        test_collection.launch!(initiated_by: author)
      end

      it 'creates open response items for each open response question' do
        expect {
          # Answer all questions
          test_collection.question_items.map do |question|
            create(:question_answer,
                   survey_response: survey_response,
                   question: question)
          end
        }.to change(Item::TextItem, :count).by(test_collection.question_items.size)
        expect(
          survey_response.question_answers.all? do |answer|
            answer.open_response_item.present?
          end,
        ).to be true
      end
    end
  end

  describe '#all_questions_answered?' do
    # Turn the 4 default cards into 4 answerable cards
    let(:test_collection) { create(:test_collection, :answerable_questions) }
    let(:survey_response) { create(:survey_response, test_collection: test_collection) }

    before do
      # this will move the questions into the TestDesign and allow the delegation to work
      test_collection.launch!
    end

    context 'no questions answered' do
      it 'returns false' do
        expect(survey_response.all_questions_answered?).to be false
      end
    end

    context 'some questions answered' do
      let!(:question_answer) do
        create(:question_answer,
               survey_response: survey_response,
               question: survey_response.answerable_complete_question_items.first)
      end

      it 'returns false' do
        expect(survey_response.all_questions_answered?).to be false
      end
    end

    context 'all questions answered' do
      let!(:question_answers) do
        survey_response.answerable_complete_question_items.map do |question|
          create(:question_answer,
                 survey_response: survey_response,
                 question: question)
        end
      end

      it 'returns true' do
        expect(survey_response.all_questions_answered?).to be true
      end
    end
  end

  describe '#question_answer_created_or_destroyed' do
    let(:test_collection) { create(:test_collection, :answerable_questions) }
    let(:survey_response) { create(:survey_response, test_collection: test_collection) }

    before do
      # this will move the questions into the TestDesign and allow the delegation to work
      test_collection.launch!
    end

    it 'changes updated_at' do
      expect {
        survey_response.question_answer_created_or_destroyed
      }.to change(survey_response, :updated_at)
    end

    it 'keeps status as in_progress' do
      expect(survey_response.in_progress?).to be true
    end

    context 'with all questions answered' do
      let!(:question_answers) do
        survey_response.answerable_complete_question_items.map do |question|
          create(:question_answer,
                 survey_response: survey_response,
                 question: question)
        end
      end

      it 'marks response as completed' do
        expect(survey_response.reload.completed?).to be true
      end
    end
  end

  describe '#cache_test_scores!' do
    let(:submission) { create(:collection) }
    let!(:test_collection) { create(:test_collection, :answerable_questions, parent_collection: submission) }
    let!(:survey_response) { create(:survey_response, test_collection: test_collection) }

    before do
      submission.update(submission_attrs: { submission: true, launchable_test_id: test_collection.id })
    end

    it 'should call cache_test_scores! on the parent_submission' do
      survey_response.cache_test_scores!
      expect(test_collection.parent_submission.cached_test_scores).to eq('total' => 0, 'question_context' => 0)
    end
  end
end
