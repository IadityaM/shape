require 'rails_helper'

RSpec.describe Group, type: :model do
  let(:organization) { create(:organization) }
  let(:group) { create(:group, organization: organization) }

  it 'should create a group shared collection' do
    expect(group.current_shared_collection).to be_truthy
  end

  context 'associations' do
    it { should belong_to :filestack_file }
  end

  context 'is primary group' do
    before do
      organization.primary_group_id = group.id
    end

    context 'after update' do
      before do
        group.update(name: '12345')
      end

      it 'should update the organization name', :vcr do
        expect(organization.name).to eq('12345')
      end
    end
  end

  context 'with users in roles' do
    let!(:admins) { create_list(:user, 3) }
    let!(:members) { create_list(:user, 3) }

    before do
      admins.each { |admin| admin.add_role(Role::ADMIN, group) }
      members.each { |member| member.add_role(Role::MEMBER, group) }
    end

    describe '#admins' do
      it 'should have all admins' do
        expect(group.admins[:users]).to match_array(admins)
      end
    end

    describe '#members' do
      it 'should have all members' do
        expect(group.members[:users]).to match_array(members)
      end
    end
  end

  describe '.viewable_in_org' do
    let!(:in_org_groups) { create_list(:group, 2, organization: organization) }
    let!(:other_org_groups) { create_list(:group, 2) }
    let!(:global_group) { create(:global_group, organization: nil) }

    it 'should include global groups and org groups' do
      # 3 org groups (admin, primary, guest), 2 more groups, 1 global group
      expect(Group.viewable_in_org(organization.id).count).to eq 6
      expect(Group.count).to eq 8
    end
  end

  describe '#archive!' do
    let(:members) { create_list(:users, 3) }
    let(:collection) { create(:collection, organization: organization) }

    before do
      group.add_role(Role::EDITOR, collection)
    end

    it 'removes the group from the collection' do
      expect(collection.editors[:groups]).to include(group)
      group.archive!
      expect(group.archived?).to be true
      expect(collection.editors[:groups]).to be_empty
    end
  end
end
