require 'rails_helper'

RSpec.describe ActivityAndNotificationBuilder, type: :service do
  let(:organization) { create(:organization) }
  let(:actor) { create(:user, add_to_org: organization) }
  let(:target_parent) { create(:collection, organization: organization) }
  let(:target) { create(:collection, parent_collection: target_parent) }
  let(:action) { :archived }
  let(:subject_users) { create_list(:user, 1) }
  let(:subject_groups) { [] }
  let(:omit_user_ids) { [] }
  let(:omit_group_ids) { [] }
  let(:combine) { false }
  let(:content) { nil }
  let(:source) { nil }
  let(:destination) { nil }
  let(:builder) do
    ActivityAndNotificationBuilder.new(
      actor: actor,
      target: target,
      action: action,
      subject_user_ids: subject_users.map(&:id),
      subject_group_ids: subject_groups.map(&:id),
      omit_user_ids: omit_user_ids,
      omit_group_ids: omit_group_ids,
      combine: combine,
      content: content,
      source: source,
      destination: destination,
    )
  end
  let!(:comment_thread) { create(:collection_comment_thread, record: target) }
  let!(:users_thread) { create(:users_thread, comment_thread: comment_thread, user: subject_users[0], subscribed: true) }

  before do
    target.reload
  end

  describe '#call' do
    it 'creates one new activity' do
      expect { builder.call }.to change(Activity, :count).by(1)
    end

    context 'with multiple users' do
      let(:subject_users) { create_list(:user, 2) }

      before do
        subject_users.each do |user|
          next if user.users_threads.any?

          create(:users_thread,
                 comment_thread: comment_thread,
                 user: user,
                 subscribed: true)
        end
      end

      it 'creates notifications for each user' do
        expect { builder.call }.to change(Notification, :count).by(2)
      end

      it 'creates activity subjects for each user' do
        expect { builder.call }.to change(ActivitySubject, :count).by(2)
      end

      context 'with action that does not notify' do
        let(:action) { :edited }

        it 'does not create notifications' do
          expect { builder.call }.not_to change(Notification, :count)
        end
      end

      context 'with action that does not have subjects' do
        let(:action) { :downloaded }

        it 'does not create activity subjects' do
          expect { builder.call }.not_to change(ActivitySubject, :count)
        end
      end

      context 'with one unsubscribed user' do
        before do
          subject_users[1].users_threads[0].update(subscribed: false)
          subject_users[1].reload
        end

        it 'creates notifications for just one user' do
          expect { builder.call }.to change(Notification, :count).by(1)
        end
      end

      context 'when unsubscribed user at a higher parent level' do
        let!(:parent_comment_thread) do
          create(:collection_comment_thread, record: target.parent)
        end
        let!(:parent_users_thread) do
          create(:users_thread,
                 comment_thread: parent_comment_thread,
                 user: subject_users[0],
                 subscribed: false)
        end

        before do
          users_thread.destroy
        end

        it 'creates notifications for each user' do
          expect { builder.call }.to change(Notification, :count).by(1)
        end
      end
    end

    context 'with a user and a group' do
      let(:subject_groups) { [create(:group, add_members: [create(:user)])] }

      before do
        subject_groups.each do |group|
          group.members[:users].each do |user|
            next if user.users_threads.any?

            create(:users_thread,
                   comment_thread: comment_thread,
                   user: user,
                   subscribed: true)
          end
        end
      end

      it 'creates notifications for each user and each user in group' do
        expect { builder.call }.to change(Notification, :count).by(2)
      end

      context 'with an omitted user' do
        let(:users) { create_list(:user, 2) }
        let(:subject_groups) { [create(:group, add_members: users)] }
        let(:omit_user_ids) { [users.first.id] }

        it 'should not notify the omitted user' do
          expect { builder.call }.to change(Notification, :count).by(2)
          expect(users.first.notifications.count).to eq 0
          expect(users.second.notifications.count).to eq 1
        end
      end

      context 'with an omitted group' do
        let(:omit_group_ids) { [subject_groups.first.id] }

        it 'should not notify the omitted group' do
          # should just notify the original user (not in the group)
          expect { builder.call }.to change(Notification, :count).by(1)
        end
      end
    end

    context 'with a user in the same group' do
      let(:subject_groups) { [create(:group, add_members: [subject_users.first])] }

      it 'does not create two notifications for the user' do
        expect { builder.call }.to change(Notification, :count).by(1)
      end
    end

    context 'when a subject user is also the actor' do
      let(:subject_users) { [actor] }

      it 'should not notify you if you are the actor' do
        builder.call
        expect { builder.call }.to change(Notification, :count).by(0)
      end
    end

    context 'with content' do
      let!(:content) { 'hello content' }

      it 'adds the content to the activity' do
        builder.call
        expect(Activity.last.content).to eq('hello content')
      end
    end

    context 'with source and destination' do
      let!(:source) { create(:collection) }
      let!(:destination) { create(:collection) }

      it 'adds the content to the activity' do
        builder.call
        expect(Activity.last.source).to eq(source)
        expect(Activity.last.destination).to eq(destination)
      end
    end

    context 'when combining' do
      let(:combine) { true }
      let(:action) { :commented }
      let(:actor2) { create(:user, add_to_org: organization) }
      let(:actor3) { create(:user, add_to_org: organization) }
      let(:actors) { [actor2, actor3] }

      before do
        actors.each do |user|
          # 2 different users commented on the target
          ActivityAndNotificationBuilder.new(
            actor: user,
            target: target,
            action: action,
            subject_user_ids: subject_users.map(&:id),
          ).call
        end
      end

      it 'destroys the previous 3 notifications' do
        expect(Notification.count).to eq 2
        # now one more user comments on the same target
        expect { builder.call }.to change(Notification, :count).by(-1)
      end

      it 'creates one notification with many combined activities' do
        builder.call
        notification = Notification.last
        expect(notification.combined_activities_ids.count).to eq 3
      end
    end

    context 'some users to be notified are archived' do
      let(:subject_users) do
        [
          create_list(:user, 2),
          create_list(:user, 2, status: :archived),
        ].flatten
      end

      before do
        subject_users.each do |user|
          next if user.users_threads.any?

          create(:users_thread,
                 comment_thread: comment_thread,
                 user: user,
                 subscribed: true)
        end
      end

      it 'does not create notifications for the archived users' do
        expect { builder.call }.to change(Notification, :count).by(2)
        Notification.all.includes(:user).each do |notification|
          expect(notification.user).not_to be_archived
        end
      end
    end
  end
end
