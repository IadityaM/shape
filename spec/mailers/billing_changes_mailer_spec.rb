require 'rails_helper'

def format_currency(amount)
  format('$%.2f', amount.round(2))
end

RSpec.describe BillingChangesMailer, type: :mailer do
  before { network_mailing_list_doubles }
  let!(:organization) { create(:organization, active_users_count: 123) }
  let!(:network_organization) { double('network_organization', id: 123) }
  let!(:user) { create(:user, add_to_org: organization) }
  let!(:payment_method) { [double('payment_method', user: user)] }
  let!(:new_active_users) { 2 }

  before do
    allow_any_instance_of(Organization).to receive(:network_organization).and_return(network_organization)
    includes = double('includes')
    allow(NetworkApi::PaymentMethod).to receive(:includes).with(:user).and_return(includes)
    allow(includes).to receive(:find).with(
      default: true,
      organization_id: network_organization.id,
    ).and_return(payment_method)
  end

  describe '#notify' do
    it 'sends to the user associated with the payment method' do
      mail = BillingChangesMailer.notify(organization.id, new_active_users)
      expect(mail.to).to eql([user.email])
    end

    it 'has a subject describing the updated user situation' do
      mail = BillingChangesMailer.notify(organization.id, new_active_users)
      expect(mail.subject).to eq("#{new_active_users} new users joined Shape")
      mail = BillingChangesMailer.notify(organization.id, 1)
      expect(mail.subject).to eq('1 new user joined Shape')
    end

    it 'renders details about billing changes' do
      mail = BillingChangesMailer.notify(organization.id, new_active_users)
      expect(mail.body.encoded).to match("#{new_active_users} new users joined Shape for your organization: #{organization.name}")
      expect(mail.body.encoded).to include("New users: #{new_active_users}")
      expect(mail.body.encoded).to include("Total users: #{organization.active_users_count}")
      expect(mail.body.encoded).to include("Additional Monthly Charge: #{format_currency(Organization::PRICE_PER_USER * new_active_users)}")
      expect(mail.body.encoded).to include("New total monthly charge: #{format_currency(Organization::PRICE_PER_USER * organization.active_users_count)}")

      price_per_user_day = Organization::PRICE_PER_USER / Time.days_in_month(Time.current.month)
      days_remaining_in_month = (Time.current.end_of_month.day - Time.current.day) + 1
      prorated_charge = (new_active_users * price_per_user_day * days_remaining_in_month).round(2)

      expect(mail.body.encoded).to include("Prorated charge this month: #{format_currency(prorated_charge)}")
      expect(mail.body.encoded).to include("Next statement date: #{Time.now.utc.end_of_month.to_s(:mdy)}")
      expect(mail.body.encoded).to include("Go To Shape: #{root_url}")
    end
  end
end
