import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { computed, observable, observe, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Element as ScrollElement, scroller } from 'react-scroll'
import VisibilitySensor from 'react-visibility-sensor'
import FlipMove from 'react-flip-move'
import _ from 'lodash'
import pluralize from 'pluralize'
import styled from 'styled-components'
import Truncator from 'react-truncator'

import { ActivityContainer } from '~/ui/global/styled/layout'
import GoIcon from '~/ui/icons/GoIcon'
import InlineLoader from '~/ui/layout/InlineLoader'
import Notification from '~/ui/notifications/Notification'
import { SmallActionText } from '~/ui/global/styled/typography'
import { ShowMoreButton } from '~/ui/global/styled/forms'
import CommentThread from './CommentThread'

function pluralTypeName(name) {
  return pluralize(name).toLowerCase()
}

const GoIconContainer = styled.span`
  display: inline-block;
  margin-right: 8px;
  vertical-align: middle;
  width: 12px;
`

const JumpButton = styled.button`
  left: 100px;
  min-height: 20px;
  margin-top: -33px;
  position: relative;
  text-align: center;
  visibility: ${props => props.hide};
  width: calc(100% - 140px);
`

@inject('apiStore', 'uiStore')
@observer
class CommentThreadContainer extends React.Component {
  prevScrollPosition = 0
  visibleThreads = observable.map({})
  @observable
  bottomOfExpandedThread = false
  @observable
  loadingThreads = false
  disposers = {
    expanded: () => null,
    expandedComments: () => null,
    currentThreads: () => null,
  }
  scrollOpts = {
    containerId: 'ctc-content',
    delay: 0,
    duration: 350,
    smooth: true,
  }

  constructor(props) {
    super(props)
    runInAction(() => {
      this.loadingThreads = props.loadingThreads
    })

    this.disposers = {}
    this.disposers.expanded = observe(
      props.uiStore,
      'expandedThreadKey',
      change => {
        if (change.newValue) {
          this.handleExpandedThreadChange(change.newValue, change.oldValue)
          const { expandedThread } = this
          if (!expandedThread) return
          this.disposers.expandedComments = expandedThread.comments.observe(
            commentChange => {
              const lastComment = _.last(expandedThread.comments)
              // if last comment is unpersisted it means I just added it; scroll me down
              if (
                this.bottomOfExpandedThread ||
                (lastComment && !lastComment.persisted)
              ) {
                this.scrollToTopOfNextThread(expandedThread, { duration: 0 })
              }
            }
          )
        }
      }
    )
    this.disposers.currentThreads = observe(
      props.apiStore,
      'currentThreads',
      change => {
        const { expandedThread } = this
        if (!expandedThread) return
        const oldThreads = change.oldValue
        const newThreads = change.newValue
        const oldIdx = oldThreads.indexOf(expandedThread)
        const newIdx = newThreads.indexOf(expandedThread)
        // if it didn't exist before, thread was newly created
        if (oldIdx === -1) return
        if (oldIdx !== newIdx) {
          const top = document.getElementsByName(`thread-${oldIdx}`)[0]
            .offsetTop
          this.prevScrollPosition = this.containerDiv.scrollTop - top
        } else if (
          this.containerDiv.scrollTop === 0 &&
          this.prevScrollPosition
        ) {
          const top = document.getElementsByName(`thread-${newIdx}`)[0]
            .offsetTop
          this.containerDiv.scrollTop = this.prevScrollPosition + top
          this.prevScrollPosition = 0
        }
      }
    )
  }

  componentDidMount() {
    const hasCurrentThread = this.jumpToCurrentThread()
    if (!hasCurrentThread) {
      this.scrollToBottom()
    }
  }

  componentDidUpdate() {
    const { loadingThreads } = this.props
    if (this.loadingThreads !== loadingThreads) {
      runInAction(() => {
        this.loadingThreads = loadingThreads
      })
      // just finished loading, make sure to re-scroll as needed
      if (!this.loadingThreads) {
        const { expandedThread } = this
        if (expandedThread) {
          this.scrollToTopOfNextThread(expandedThread)
        }
      }
    }
  }

  componentWillUnmount() {
    // cancel the observers
    _.each(this.disposers, disposer => disposer())
  }

  handleVisibilityChange = i => isVisible => {
    runInAction(() => {
      this.visibleThreads.set(i, isVisible)
    })
    const { expandedThread } = this
    if (expandedThread) {
      const idx = this.threads.indexOf(expandedThread)
      const nextIdx = idx + 1
      runInAction(() => {
        if (this.visibleThreads[nextIdx]) {
          if (
            expandedThread.unreadCount ||
            expandedThread.latestUnreadComments.length
          ) {
            expandedThread.API_markViewed()
          }
          this.bottomOfExpandedThread = true
        } else {
          this.bottomOfExpandedThread = false
        }
      })
    }
  }

  handleExpandedThreadChange = async (expandedThreadKey, prevKey) => {
    const thread = this.threads.filter(t => t.key === expandedThreadKey)[0]
    if (!thread) return
    // no change
    if (thread.id && expandedThreadKey === prevKey) return
    // don't try to load comments of our newly constructed threads
    if (thread.persisted) {
      runInAction(() => {
        this.loadingThreads = true
      })
      try {
        await thread.API_fetchComments()
      } finally {
        runInAction(() => {
          this.loadingThreads = false
        })
      }
    }
    // scroll again after any more comments have loaded
    this.scrollToTopOfNextThread(thread)
  }

  get threads() {
    const { apiStore } = this.props
    // double check to filter out ones you've just unsubscribed from
    // as well as keeping the current page thread available
    return apiStore.currentThreads.filter(
      t =>
        t.key === apiStore.currentPageThreadKey ||
        (t.users_thread && t.users_thread.subscribed)
    )
  }

  get containerDiv() {
    return document.getElementById(this.scrollOpts.containerId)
  }

  @computed
  get showJumpToThreadButton() {
    const { apiStore, uiStore } = this.props
    const { viewingRecord, viewingCollection } = uiStore
    if (
      !viewingRecord ||
      (viewingCollection && !viewingCollection.isNormalCollection)
    )
      return false
    const thread = apiStore.findThreadForRecord(uiStore.viewingRecord)
    const idx = this.threads.indexOf(thread)
    return !this.visibleThreads.get(idx)
  }

  get expandedThread() {
    const { uiStore } = this.props
    return this.threads.filter(t => t.key === uiStore.expandedThreadKey)[0]
  }

  get trackedNotifications() {
    const { apiStore, uiStore } = this.props
    const notifications = Array.from(apiStore.recentNotifications.values())
    return notifications.filter(notification => {
      // notification may have been cleared out
      if (!notification) return false
      const { activity } = notification
      // bug?
      if (!activity) return false
      if (activity.action === 'mentioned') return true
      const identifier = `${pluralTypeName(activity.target_type)}${
        activity.target_id
      }`
      return uiStore.trackedRecords.get(identifier)
    })
  }

  contentHeight = () => {
    let h = this.containerDiv ? this.containerDiv.clientHeight : 0
    // TODO: we may not actually use this "older threads" button
    h -= document.getElementById('ctc-older-threads').clientHeight || 0
    return h
  }

  expandThread = thread => () => {
    const { uiStore } = this.props
    const { key } = thread
    this.scrollToTopOfNextThread(thread)
    uiStore.expandThread(key, { reset: false })
  }

  scrollToTopOfThread = thread => {
    const idx = this.threads.indexOf(thread)
    scroller.scrollTo(`thread-${idx}`, {
      ...this.scrollOpts,
      delay: 0,
    })
  }

  scrollToTopOfNextThread = (
    thread,
    { duration = this.scrollOpts.duration } = {}
  ) => {
    const idx = this.threads.indexOf(thread)
    const nextIdx = idx + 1
    // have to wait for this thread to expand so the next one is actually lower,
    // then we can scroll down to the top of the next thread.
    setTimeout(() => {
      // may have switched pages at some point e.g. on load of ?open=xxx
      if (this.props.uiStore.activityLogPage !== 'comments') return
      scroller.scrollTo(`thread-${nextIdx}`, {
        ...this.scrollOpts,
        duration,
        offset: -1 * this.contentHeight(),
      })
    }, 50)
  }

  scrollToBottom = () => {
    scroller.scrollTo(`thread-${this.threads.length}`, {
      ...this.scrollOpts,
      delay: 0,
    })
  }

  jumpToBottom = () => {
    scroller.scrollTo(`thread-${this.threads.length}`, {
      ...this.scrollOpts,
      delay: 0,
      duration: 0,
      smooth: null,
    })
  }

  afterSubmit = thread => () => {
    this.scrollToTopOfNextThread(thread)
  }

  isExpanded = key => {
    const { uiStore } = this.props
    return uiStore.expandedThreadKey === key
  }

  jumpToCurrentThread = () => {
    const { apiStore, uiStore } = this.props
    const thread = apiStore.findThreadForRecord(uiStore.viewingRecord)
    if (!thread) return false
    uiStore.expandThread(thread.key)
    this.scrollToTopOfNextThread(thread)
    return true
  }

  loadMorePages = () => {
    const { apiStore, uiStore } = this.props
    uiStore.expandThread(null)
    apiStore.loadNextThreadPage()
  }

  renderThreads = () =>
    this.threads.map((thread, i) => (
      <ScrollElement name={`thread-${i}`} key={thread.key}>
        <VisibilitySensor
          offset={{
            top: 10,
          }}
          partialVisibility
          containment={this.containerDiv}
          onChange={this.handleVisibilityChange(i)}
        >
          <CommentThread
            thread={thread}
            expanded={this.isExpanded(thread.key)}
            onClick={this.expandThread(thread)}
            afterSubmit={this.afterSubmit(thread)}
            onEditorHeightChange={this.jumpToBottom}
          />
        </VisibilitySensor>
      </ScrollElement>
    ))

  render() {
    const { apiStore, uiStore, parentWidth } = this.props
    const hideJumpButton = this.showJumpToThreadButton ? 'visible' : 'hidden'
    return (
      <Fragment>
        <JumpButton
          hide={hideJumpButton}
          onClick={this.jumpToCurrentThread}
          className="jumpToThread"
        >
          <SmallActionText style={{ textAlign: 'center' }}>
            <GoIconContainer>
              <GoIcon />
            </GoIconContainer>
            <Truncator
              text={`
                Go to ${uiStore.viewingRecord && uiStore.viewingRecord.name}
              `}
              key="jumpbutton"
              overrideWidth={parentWidth > 600 ? parentWidth : parentWidth - 90}
              overrideStyle={{ display: 'inline-block' }}
            />
          </SmallActionText>
        </JumpButton>
        <div
          style={{
            position: 'absolute',
            top: '62px',
            zIndex: 500,
            width: '100%',
          }}
        >
          {this.trackedNotifications.map(notification => (
            <Notification
              notification={notification}
              key={notification.id}
              styleType="alert"
            />
          ))}
        </div>
        <ActivityContainer
          moving={uiStore.activityLogMoving}
          id={this.scrollOpts.containerId}
        >
          <div id="ctc-older-threads">
            {apiStore.hasOlderThreads && (
              <ShowMoreButton darkBg onClick={this.loadMorePages}>
                Load older threads...
              </ShowMoreButton>
            )}
          </div>
          {this.loadingThreads && <InlineLoader fixed background="none" />}
          <FlipMove disableAllAnimations={!!uiStore.expandedThreadKey}>
            {this.renderThreads()}
          </FlipMove>
          <ScrollElement name={`thread-${this.threads.length}`}>
            <VisibilitySensor
              partialVisibility
              containment={this.containerDiv}
              onChange={this.handleVisibilityChange(this.threads.length)}
            >
              {/* placeholder so that "bottomOfExpandedThread" will get triggered */}
              <div
                style={{ height: '5px', position: 'relative', top: '-10px' }}
              />
            </VisibilitySensor>
          </ScrollElement>
        </ActivityContainer>
      </Fragment>
    )
  }
}

CommentThreadContainer.propTypes = {
  parentWidth: PropTypes.number.isRequired,
  loadingThreads: PropTypes.bool.isRequired,
}
CommentThreadContainer.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
CommentThreadContainer.displayName = 'CommentThreadContainer'

export default CommentThreadContainer
