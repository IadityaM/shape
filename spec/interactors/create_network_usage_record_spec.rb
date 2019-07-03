require 'rails_helper'

RSpec.describe CreateNetworkUsageRecord, type: :service do
  let(:organization) { create(:organization_without_groups) }
  let(:billable_users_count) { 10 }
  subject(:context) do
    CreateNetworkUsageRecord.call(
      organization: organization,
      billable_users_count: billable_users_count,
    )
  end

  describe '#call' do
    context 'with billable users' do
      let(:billable_users_count) { 10 }

      it 'creates a NetworkApi::UsageRecord' do
        expect(NetworkApi::UsageRecord).to receive(:create).with(
          quantity: billable_users_count,
          timestamp: Time.current.end_of_day.to_i,
          external_organization_id: organization.id,
        )
        expect(context).to be_a_success
      end
    end

    context 'with zero billable users' do
      let(:billable_users_count) { 0 }

      it 'does not create a NetworkApi::UsageRecord' do
        expect(NetworkApi::UsageRecord).not_to receive(:create)
        expect(context).to be_a_success
      end
    end

    context 'with a network error when creating a UsageRecord' do
      before do
        allow(NetworkApi::UsageRecord).to receive(:create)
          .and_raise(JsonApiClient::Errors::ServerError.new('an error'))
      end

      it 'fails' do
        expect(context).to be_a_failure
      end
    end
  end
end
