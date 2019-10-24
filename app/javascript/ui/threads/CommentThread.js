import _ from 'lodash'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Comment from '~/ui/threads/Comment'
import CommentEntryForm from '~/ui/threads/CommentEntryForm'
import CommentThreadLoader from '~/ui/threads/CommentThreadLoader'
import CommentThreadHeader from '~/ui/threads/CommentThreadHeader'
import { Element as ScrollElement } from 'react-scroll'

@inject('apiStore', 'uiStore')
@observer
class CommentThread extends React.Component {
  componentDidMount() {
    const { uiStore } = this.props
    this.updateContainerSize()
    uiStore.scrollToBottomOfComments()
  }

  componentDidUpdate(prevProps) {
    const {
      apiStore,
      thread,
      commentCount,
      handleScrollOnCommentUpdate,
    } = this.props
    if (commentCount !== prevProps.commentCount) {
      this.updateContainerSize()
      // this scroll only happens when you're at the bottom of the thread
      handleScrollOnCommentUpdate()
    }
    if (thread.id !== prevProps.thread.id) {
      // when switching between threads
      this.updateContainerSize()
      apiStore.collapseReplies()
    }
  }

  updateContainerSize() {
    const { thread } = this.props
    const div = document.getElementById(thread.containerId)
    if (div && div.scrollHeight) {
      this.props.updateContainerSize({
        h: div.scrollHeight + 100,
        temporary: true,
      })
    }
  }

  renderComments = () => {
    const { thread, uiStore } = this.props
    const { comments } = thread
    if (!comments || comments.length <= 0) return []
    const commentsList = []
    _.each(comments, (comment, i) => {
      const expanded = uiStore.replyingToCommentId === comment.id
      commentsList.push(
        <Comment
          key={comment.id || `comment-new-${i}`}
          comment={comment}
          expanded={expanded}
        />
      )

      // render the reply level entry form when replying
      if (expanded) {
        commentsList.push(this.renderCommentEntryForm())
      }

      commentsList.push(
        <ScrollElement
          key={`${comment.id}-replies-bottom`}
          name={`${comment.id}-replies-bottom`}
        />
      )
    })
    return commentsList
  }

  renderCommentEntryForm = () => {
    const { thread, uiStore } = this.props
    return (
      <CommentEntryForm
        key={'comment-entry-form'}
        thread={thread}
        afterSubmit={this.props.afterSubmit}
        onHeightChange={this.props.onEditorHeightChange}
        commentingOnRecord={uiStore.commentingOnRecord}
      />
    )
  }

  render() {
    const { thread, uiStore } = this.props

    return (
      <div id={thread.containerId}>
        <CommentThreadHeader thread={thread} sticky />
        <div className="comments">
          {thread.hasMore && <CommentThreadLoader thread={thread} />}
          {this.renderComments()}
        </div>
        {/* render the top level entry form */}
        {!uiStore.replyingToCommentId && this.renderCommentEntryForm()}
      </div>
    )
  }
}

CommentThread.propTypes = {
  afterSubmit: PropTypes.func.isRequired,
  onEditorHeightChange: PropTypes.func.isRequired,
  thread: MobxPropTypes.objectOrObservableObject.isRequired,
  commentCount: PropTypes.number.isRequired,
  updateContainerSize: PropTypes.func.isRequired,
  handleScrollOnCommentUpdate: PropTypes.func.isRequired,
}
CommentThread.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

CommentThread.displayName = 'CommentThread'

export default CommentThread
