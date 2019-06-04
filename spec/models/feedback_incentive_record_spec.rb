require 'rails_helper'

RSpec.describe FeedbackIncentiveRecord, type: :model do
  context 'associations' do
    it { should belong_to :user }
    it { should belong_to :survey_response }
  end
end
