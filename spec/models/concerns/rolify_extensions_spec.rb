require 'rails_helper'

describe RolifyExtensions, type: :concern do
  let!(:user) { create(:user) }
  let!(:organization) { create(:organization, member: user) }
  let(:collection) { create(:collection, organization: organization) }
  let(:group) { create(:group, organization: organization) }

  it 'should have concern included' do
    expect(User.ancestors).to include(RolifyExtensions)
  end

  describe 'callbacks' do
    describe '#clear_cached_roles' do
      it 'should reset has_role_by_identifier? after add_role' do
        expect {
          user.add_role(Role::EDITOR, collection)
        }.to change {
          user.reload.has_role_by_identifier?(Role::EDITOR, collection.roles_anchor_resource_identifier)
        }.from(false).to(true)
      end

      it 'should reset has_role_by_identifier? after remove_role' do
        user.add_role(Role::EDITOR, collection)
        expect {
          user.remove_role(Role::EDITOR, collection)
        }.to change {
          user.reload.has_role_by_identifier?(Role::EDITOR, collection.roles_anchor_resource_identifier)
        }.from(true).to(false)
      end
    end
  end

  describe '#has_role_by_identifier?' do
    let(:has_editor_role) do
      user.has_role_by_identifier?(Role::EDITOR, collection.roles_anchor_resource_identifier)
    end
    let(:has_viewer_role) do
      user.has_role_by_identifier?(Role::VIEWER, collection.roles_anchor_resource_identifier)
    end

    context 'with user roles' do
      it 'returns true if user has role' do
        user.add_role(Role::EDITOR, collection)
        expect(has_editor_role).to be true
      end

      it 'returns false if user does not have role' do
        expect(has_editor_role).to be false
      end
    end

    context 'with a user in a group' do
      let!(:group) { create(:group, organization: organization) }

      before do
        user.add_role(Role::MEMBER, group)
      end

      it 'returns false if group does not have role' do
        expect(has_editor_role).to be false
        expect(has_viewer_role).to be false
      end

      it 'returns true if user has viewer role through group' do
        group.add_role(Role::VIEWER, collection)
        expect(has_viewer_role).to be true
        expect(has_editor_role).to be false
      end

      it 'returns true if user has editor role through group' do
        group.add_role(Role::EDITOR, collection)
        expect(has_editor_role).to be true
        expect(has_viewer_role).to be false
      end
    end

    context 'with a group in a group' do
      let!(:group) { create(:group, organization: organization) }
      let!(:parent_group) do
        create(:group, organization: organization, add_subgroups: [group])
      end
      let(:has_editor_role) do
        group.has_role_by_identifier?(Role::EDITOR, collection.roles_anchor_resource_identifier)
      end
      let(:has_viewer_role) do
        group.has_role_by_identifier?(Role::VIEWER, collection.roles_anchor_resource_identifier)
      end

      before do
        group.add_role(Role::MEMBER, parent_group)
      end

      it 'returns false if group does not have role' do
        expect(has_editor_role).to be false
        expect(has_viewer_role).to be false
      end

      it 'returns true if group has viewer role through parent group' do
        parent_group.add_role(Role::VIEWER, collection)
        expect(has_viewer_role).to be true
        expect(has_editor_role).to be false
      end

      it 'returns true if group has editor role through parent group' do
        parent_group.add_role(Role::EDITOR, collection)
        expect(has_editor_role).to be true
        expect(has_viewer_role).to be false
      end
    end
  end

  describe '#precache_roles_for' do
    let(:collection_cards) { create_list(:collection_card_text, 3, parent: collection) }
    let(:group) { create(:group, add_members: [user], organization: organization) }

    before do
      user.add_role(Role::EDITOR, collection)
      collection_cards.each do |cc|
        group.add_role(Role::VIEWER, cc.item)
        cc.record.unanchor_and_inherit_roles_from_anchor!
        # make the user a viewer on the records
        user.remove_role(Role::EDITOR, cc.record)
        user.add_role(Role::VIEWER, cc.record)
      end
      user.reset_cached_roles!
    end

    it 'returns nil unless `has_role_by_identifier?` has been called' do
      has_roles = user.precache_roles_for([Role::VIEWER], resources: [collection])
      expect(has_roles).to be nil
    end

    it 'precaches role relationships into @has_role_by_identifier' do
      # perform one query to prime the @has_role_by_identifier hash
      # (e.g. this may happen during load_and_authorize_resource)
      user.has_role_by_identifier? Role::EDITOR, collection.roles_anchor_resource_identifier
      has_roles = user.precache_roles_for(
        [Role::VIEWER, Role::CONTENT_EDITOR, Role::EDITOR],
        resources: collection.children_and_linked_children,
      )
      expect(has_roles).to include(
        ['editor', collection.roles_anchor_resource_identifier] => true,
        ['viewer', collection_cards.first.record.roles_anchor_resource_identifier] => true,
        ['viewer', collection_cards.second.record.roles_anchor_resource_identifier] => true,
      )
    end

    it 'precaches role relationships using resource_identifiers' do
      # perform one query to prime the @has_role_by_identifier hash
      # (e.g. this may happen during load_and_authorize_resource)
      user.has_role_by_identifier? Role::EDITOR, collection.roles_anchor_resource_identifier
      identifiers = collection.children_and_linked_children.map(&:roles_anchor_resource_identifier).uniq
      has_roles = user.precache_roles_for(
        [Role::VIEWER, Role::CONTENT_EDITOR, Role::EDITOR],
        resource_identifiers: identifiers,
      )
      expect(has_roles).to include(
        ['editor', collection.roles_anchor_resource_identifier] => true,
        ['viewer', collection_cards.first.record.roles_anchor_resource_identifier] => true,
        ['viewer', collection_cards.second.record.roles_anchor_resource_identifier] => true,
      )
    end
  end

  describe '#add_role' do
    # test special case for only being admin/member of group
    let(:group) { create(:group, organization: organization) }

    it 'does not add admin role if already a member' do
      # initial role should add
      expect {
        user.add_role(Role::MEMBER, group)
      }.to change(user.users_roles, :count)

      # further additions should not change the count
      expect {
        user.add_role(Role::MEMBER, group)
      }.to not_change(user.users_roles, :count)

      # further additions should not change the count
      expect {
        user.add_role(Role::ADMIN, group)
      }.to not_change(user.users_roles, :count)
    end

    it 'does not add viewer role if already an editor' do
      # initial role should add
      expect {
        user.add_role(Role::EDITOR, collection)
      }.to change(user.users_roles, :count)

      # further additions should not change the count
      expect {
        user.add_role(Role::EDITOR, collection)
      }.to not_change(user.users_roles, :count)

      # further additions should not change the count
      expect {
        user.add_role(Role::VIEWER, collection)
      }.to not_change(user.users_roles, :count)
    end

    it 'upgrades to editor role if already an viewer' do
      # initial role should add
      expect {
        user.add_role(Role::VIEWER, collection)
      }.to change(user.users_roles, :count)
      expect(collection.can_edit?(user)).to be false

      # further additions should not change the count
      expect {
        user.add_role(Role::EDITOR, collection)
      }.to not_change(user.users_roles, :count)
      user.reload
      expect(collection.can_edit?(user)).to be true
    end

    context 'when adding a group to another group' do
      let(:other_group) { create(:group, organization: organization) }

      it 'calls add_subgroup' do
        expect(other_group).to receive(:add_subgroup).with(group)
        group.add_role(Role::MEMBER, other_group)
      end
    end

    context 'with roles_anchor already set' do
      let!(:collection) { create(:collection, organization: organization, roles_anchor_collection_id: 99) }

      it 'returns false and does not add the role' do
        expect(user.add_role(Role::EDITOR, collection)).to be false
        expect(collection.can_edit?(user)).to be false
      end

      it 'does not create a Role' do
        expect {
          user.add_role(Role::EDITOR, collection)
        }.to not_change(Role, :count)
      end
    end
  end

  describe '#remove_role' do
    let(:group) { create(:group, organization: organization) }
    let(:other_group) { create(:group, organization: organization) }

    context 'when removing a group from another group' do
      it 'calls the group removal service' do
        expect(other_group).to receive(:remove_subgroup).with(group)
        group.add_role(Role::MEMBER, other_group)
        group.remove_role(Role::MEMBER, other_group)
      end
    end
  end

  describe '#upgrade_to_edit_role' do
    before do
      user.add_role(Role::CONTENT_EDITOR, collection)
    end

    it 'should remove content editor role and upgrade to editor' do
      user.upgrade_to_edit_role(collection)
      expect(collection.can_edit?(user)).to be true
    end

    context 'for a group' do
      before do
        group.add_role(Role::VIEWER, collection)
      end

      it 'should remove viewer role and upgrade to editor' do
        group.upgrade_to_edit_role(collection)
        expect(collection.can_edit?(group)).to be true
      end
    end
  end
end
