require 'rails_helper'

describe User, type: :model do
  let!(:user) { create(:user) }

  context 'validations' do
    it { should validate_presence_of(:uid) }
    it { should validate_presence_of(:provider) }
    it { should validate_presence_of(:email) }
  end

  context 'callbacks' do
    let!(:org) { create(:organization) }
    let(:org_group) { org.primary_group }
    let!(:org_2) { create(:organization) }
    let(:org_2_group) { org_2.primary_group }

    describe '#after_add_role' do
      before do
        user.add_role(Role::MEMBER, org_group)
        user.reload
      end

      it 'should set current_organization' do
        expect(user.current_organization).to eq(org)
      end

      it 'should not override current_organization if already set' do
        user.add_role(Role::MEMBER, org_2_group)
        expect(user.reload.current_organization).to eq(org)
      end
    end

    describe '#after_remove_role' do
      before do
        user.add_role(Role::MEMBER, org_group)
      end

      it 'should set another org they belonged to as current' do
        user.add_role(Role::MEMBER, org_2_group)
        expect(user.reload.current_organization).to eq(org)

        user.remove_role(Role::MEMBER, org_group)
        expect(user.reload.current_organization).to eq(org_2)
      end

      it 'should remove current_organization if user only belonged to one' do
        user.remove_role(Role::MEMBER, org_group)
        expect(user.reload.current_organization).to  be_nil
      end
    end

    describe '#create_user_collection' do
      let(:user) { create(:user) }
      let!(:organization) { create(:organization) }
      let(:user_collections) { user.collections.user }

      before do
        user.add_role(Role::MEMBER, organization.primary_group)
      end

      it 'should create a Collection::UserCollection' do
        expect(user_collections.size).to eq(1)
        expect(user_collections[0]).to be_instance_of(Collection::UserCollection)
        expect(user_collections[0].persisted?).to be true
      end
    end
  end

  describe '#organizations' do
    let!(:organizations) { create_list(:organization, 2) }

    before do
      user.add_role(Role::MEMBER, organizations[0].primary_group)
      user.add_role(Role::ADMIN, organizations[1].primary_group)
    end

    it 'should return all organizations they have any role on' do
      expect(user.organizations).to match_array(organizations)
    end
  end

  describe '#name' do
    it 'should concatenate first and last name' do
      expect(user.name).to eq("#{user.first_name} #{user.last_name}")
    end

    it 'should not include spaces if first name is empty' do
      user.first_name = nil
      expect(user.name).to eq(user.last_name)
    end

    it 'should not include spaces if last name is empty' do
      user.last_name = nil
      expect(user.name).to eq(user.first_name)
    end
  end

  describe '#search_data' do
    let!(:user) { create(:user) }
    let(:organizations) { create_list(:organization, 2) }

    it 'should include name, email, organization_ids' do
      expect(user.search_data).to eq(
        {
          name: user.name,
          email: user.email,
          organization_ids: [],
        }
      )
    end

    context 'if user is member of orgs' do
      before do
        user.add_role(:member, organizations[0].primary_group)
        user.add_role(:member, organizations[1].primary_group)
      end

      it 'should have org ids' do
        expect(user.search_data[:organization_ids]).to match_array(organizations.map(&:id))
      end
    end
  end
end
