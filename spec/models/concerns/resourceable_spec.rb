require 'rails_helper'

describe Resourceable, type: :concern do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let(:collection) { create(:collection) }

  it 'should have concern included' do
    expect(Collection.ancestors).to include(Resourceable)
  end

  describe '#dynamic_role_names' do
    # Note: these will fail if we ever change role names... so it's a bit brittle
    it 'defines given roles' do
      expect(collection.respond_to?(:editors)).to be true
      expect(collection.respond_to?(:viewers)).to be true
    end

    it 'returns nothing when unassigned' do
      expect(collection.viewers[:users]).to be_empty
      expect(collection.viewers[:groups]).to be_empty
    end

    context 'when assigning roles' do
      before do
        user.add_role(Role::EDITOR, collection)
        group.add_role(Role::EDITOR, collection)
      end

      it 'returns users assigned' do
        expect(collection.editors[:users]).to match_array([user])
      end

      it 'returns groups assigned' do
        expect(collection.editors[:groups]).to match_array([group])
      end
    end
  end

  describe '#can_edit?' do
    it 'returns false' do
      expect(collection.can_edit?(user)).to be false
    end

    context 'as editor' do
      before do
        user.add_role(Role::EDITOR, collection)
      end

      it 'returns true' do
        expect(collection.can_edit?(user)).to be true
      end
    end
  end

  describe '#can_edit_content?' do
    it 'returns false' do
      expect(collection.can_edit_content?(user)).to be false
    end

    context 'as content editor' do
      before do
        user.add_role(Role::CONTENT_EDITOR, collection)
      end

      it 'returns true' do
        expect(collection.can_edit_content?(user)).to be true
      end
    end

    context 'as editor' do
      before do
        user.add_role(Role::EDITOR, collection)
      end

      it 'returns true' do
        expect(collection.can_edit_content?(user)).to be true
      end
    end
  end

  describe '#can_view?' do
    it 'returns false for user' do
      expect(collection.can_view?(user)).to be false
    end

    it 'returns false for group' do
      expect(collection.can_view?(group)).to be false
    end

    context 'as viewer' do
      before do
        user.add_role(Role::VIEWER, collection)
        group.add_role(Role::VIEWER, collection)
      end

      it 'returns true for user' do
        expect(collection.can_view?(user)).to be true
      end

      it 'returns true for group' do
        expect(collection.can_view?(group)).to be true
      end
    end

    context 'as editor' do
      before do
        user.add_role(Role::EDITOR, collection)
        group.add_role(Role::EDITOR, collection)
      end

      it 'returns true for user' do
        expect(collection.can_view?(user)).to be true
      end

      it 'returns true for group' do
        expect(collection.can_view?(group)).to be true
      end
    end
  end

  context 'getting all editors and viewers' do
    let(:group_members) { create_list(:user, 2) }
    let(:other_user) { group_members.first }
    let(:group) { create(:group, add_members: group_members) }

    describe '#user_and_group_identifiers_with_edit_access' do
      before do
        user.add_role(Role::EDITOR, collection)
        group.add_role(Role::EDITOR, collection)
        other_user.add_role(Role::VIEWER, collection)
      end

      it 'gets all editor user and group identifiers' do
        expect(collection.user_and_group_identifiers_with_edit_access).to match_array([
          "User_#{user.id}",
          "Group_#{group.id}",
        ])
      end
    end

    describe '#user_and_group_identifiers_with_view_access' do
      before do
        user.add_role(Role::VIEWER, collection)
        group.add_role(Role::VIEWER, collection)
        other_user.add_role(Role::EDITOR, collection)
      end

      it 'gets combined viewer and editor user and group identifiers' do
        expect(collection.user_and_group_identifiers_with_view_access).to match_array([
          "User_#{user.id}",
          "User_#{other_user.id}",
          "Group_#{group.id}",
        ])
      end
    end
  end

  describe '.viewable_by' do
    let(:organization) { create(:organization, member: user) }
    let(:collection) { create(:collection, organization: organization, add_viewers: [user]) }
    let(:group_collection) { create(:collection, organization: organization, add_viewers: [organization.primary_group]) }
    let(:other_collection) { create(:collection, organization: organization) }

    it 'should return all collections you have access to via user or group roles' do
      expect(Collection.viewable_by(user, organization)).to include(collection, group_collection)
      expect(Collection.viewable_by(user, organization)).not_to include(other_collection)
    end
  end

  context 'with anchored_roles' do
    let(:subcollection) { create(:collection, parent_collection: collection, roles_anchor_collection: collection) }
    let(:item) { create(:text_item, parent_collection: subcollection, roles_anchor_collection: collection) }

    before do
      user.add_role(Role::VIEWER, collection)
      group.add_role(Role::VIEWER, collection)
    end

    it 'should refer to the roles_anchor to get its roles' do
      expect(item.anchored_roles).to eq collection.roles
    end

    it 'should have the same access as its anchor' do
      expect(item.can_view?(user)).to be true
      expect(item.can_view?(group)).to be true
    end

    it 'should use the roles_anchor for its dynamic methods' do
      expect(item.viewers).to eq collection.viewers
    end

    describe '#inherit_roles_anchor_from_parent!' do
      let(:other_collection) { create(:collection, roles_anchor_collection: subcollection) }
      let(:item) { create(:text_item, parent_collection: subcollection, roles_anchor_collection: other_collection) }

      it 'should copy roles anchor from its parent' do
        expect(item.anchored_roles).to be_empty
        item.inherit_roles_anchor_from_parent!
        expect(item.anchored_roles).to eq subcollection.anchored_roles
        expect(item.anchored_roles).to eq collection.roles
      end
    end

    describe '#unanchor_and_inherit_roles_from_anchor!' do
      it 'should duplicate all the roles onto the resource and remove the roles_anchor_collection' do
        expect(item.roles_anchor_collection_id).to eq collection.id
        expect(item.roles).to be_empty
        expect(item.can_view?(user)).to be true
        # now unanchor...
        item.unanchor_and_inherit_roles_from_anchor!
        # should be anchored to itself
        expect(item.roles_anchor_collection_id).to be_nil
        expect(item.roles_anchor).to eq item
        expect(item.roles.count).to eq collection.roles.count
        expect(item.can_view?(user)).to be true
      end

      context 'with a test collection' do
        let(:test_collection) { create(:test_collection, parent_collection: collection, roles_anchor_collection: collection) }
        let(:question_item) { test_collection.question_items.first }

        it 'should update the question_items roles_anchor to be itself' do
          expect(question_item.roles_anchor_collection_id).to eq collection.id
          test_collection.unanchor_and_inherit_roles_from_anchor!
          expect(question_item.reload.roles_anchor_collection_id).to eq test_collection.id
        end
      end

      context 'with related roles on parent' do
        let(:other_user) { create(:user) }
        let(:card) { create(:collection_card_text, parent: collection) }
        let(:item) { card.item }

        before do
          item.reload.unanchor_and_inherit_roles_from_anchor!
        end

        context 'with editors and viewers' do
          let(:collection) { create(:collection, add_editors: [user], add_viewers: [other_user]) }

          it 'should copy roles from parent to newly created child' do
            expect(item.editors[:users]).to match_array(collection.editors[:users])
            expect(item.viewers[:users]).to match_array(collection.viewers[:users])
          end
        end

        context 'with content editors' do
          let(:collection) { create(:collection, add_content_editors: [user]) }

          it 'should make the content editors into editors of the child content' do
            expect(item.editors[:users]).to match_array(collection.content_editors[:users])
          end
        end
      end
    end
  end
end
