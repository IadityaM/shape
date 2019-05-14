import _ from 'lodash'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import { observe } from 'mobx'

import { apiStore } from '~/stores'
import trackError from '~/utils/trackError'

let db = {}
if (process.env.GOOGLE_CLOUD_BROWSER_KEY) {
  firebase.initializeApp({
    apiKey: process.env.GOOGLE_CLOUD_BROWSER_KEY,
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  })
  db = firebase.firestore()
  db.settings({
    // recommending setting for Firestore 5.0+
    timestampsInSnapshots: true,
  })
}

export class FirebaseClient {
  subscribedThreadIds = []
  loadedThreadIds = []
  constructor() {
    this.listeners = []
    observe(apiStore, 'currentUserOrganizationId', change => {
      if (
        change.type === 'update' &&
        change.oldValue &&
        change.newValue !== change.oldValue
      ) {
        this.stopListening()
        this.startListening()
      }
    })
    observe(apiStore, 'usersThreadPagesToLoad', change => {
      if (
        change.type === 'update' &&
        change.oldValue &&
        change.newValue !== change.oldValue
      ) {
        this.listenForUsersThreads(apiStore.currentUserId, change.newValue)
      }
    })
  }

  startListening() {
    if (!apiStore.currentUserId) return
    this.listenForUsersThreads(apiStore.currentUserId)
    this.listenForUserNotifications(apiStore.currentUserId)
  }

  stopListening() {
    this.listeners.forEach(listener => {
      _.isFunction(listener) && listener()
    })
    this.listeners = []
    apiStore.removeAll('notifications')
    apiStore.removeAll('users_threads')
    apiStore.removeAll('comment_threads')
    apiStore.removeAll('comments')
  }

  authenticate = token => {
    firebase.auth().signInWithCustomToken(token)
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.startListening()
      }
    })
  }

  listenForUserNotifications = userId => {
    const orgId = apiStore.currentUserOrganizationId
    this.notificationsListener = db
      .collection('notifications')
      .where('data.attributes.identifier', '==', `${orgId}_${userId}`)
      .limit(50)
      .orderBy('data.attributes.created_at', 'desc')
      .onSnapshot(querySnapshot => {
        querySnapshot.forEach(
          doc => {
            const record = apiStore.syncFromFirestore(doc.data())
            if (
              new Date(record.created_at).getTime() >
              Date.now() - 30 * 1000
            ) {
              apiStore.addRecentNotification(record)
            }
            const changes = querySnapshot.docChanges()
            if (changes) {
              changes.forEach(change => {
                // remove all notifications that were deleted
                if (change.type === 'removed') {
                  apiStore.remove('notifications', change.doc.id)
                }
              })
            }
          },
          err => {
            trackError(err, { name: 'Firestore:Notifications' })
          }
        )
      })
    this.listeners.push(this.notificationsListener)
  }

  listenForUsersThreads = (userId, pages = 1) => {
    const orgId = apiStore.currentUserOrganizationId
    if (this.userThreadListener) {
      // unsubscribe to any previous listener
      this.userThreadListener()
    }
    const PER_PAGE = 20
    this.userThreadListener = db
      .collection('users_threads')
      .where('data.attributes.identifier', '==', `${orgId}_${userId}`)
      .where('data.attributes.subscribed', '==', true)
      .orderBy('data.attributes.updated_at', 'desc')
      .limit(PER_PAGE * pages)
      .onSnapshot(
        querySnapshot => {
          querySnapshot.forEach(doc => {
            const usersThread = apiStore.syncFromFirestore(doc.data())
            this.subscribeToThread(usersThread)
          })
          if (querySnapshot.size < PER_PAGE * pages) {
            apiStore.update('hasOlderThreads', false)
            this.checkIfFinishedLoading()
          } else {
            apiStore.update('hasOlderThreads', true)
          }
        },
        error => {
          this.escapeLoader()
          trackError(error, { name: 'Firestore:UserThreads' })
        }
      )
    this.listeners.push(this.userThreadListener)
  }

  commentsForThread = threadId =>
    (this.commentsListener = db
      .collection('comments')
      .where('data.attributes.comment_thread_id', '==', parseInt(threadId))
      .orderBy('data.attributes.created_at', 'desc'))

  subscribeToThread = usersThread => {
    const threadId = usersThread.comment_thread_id
    // check if we're already listening for this thread
    if (this.subscribedThreadIds.indexOf(threadId) > -1) return
    apiStore.update('loadingThreads', true)
    this.subscribedThreadIds.push(threadId)
    const threadUid = threadId.toString()
    const firestoreThread = db.collection('comment_threads').doc(threadUid)
    firestoreThread
      // get() to ensure document exists before listening, otherwise firestore throws errors
      .get()
      .then(doc => {
        this.commentThreadsListener = firestoreThread.onSnapshot(
          threadDoc => {
            const thread = apiStore.syncFromFirestore(threadDoc.data())
            this.commentsListener = this.commentsForThread(threadUid)
              .limit(3)
              .get()
              .then(snapshots => {
                const comments = []
                snapshots.docs.forEach(commentDoc => {
                  const comment = apiStore.syncFromFirestore(commentDoc.data())
                  comments.push(comment)
                })
                apiStore.importUsersThread({
                  usersThread,
                  thread,
                  comments,
                })
                this.loadedThreadIds.push(threadId)
                this.checkIfFinishedLoading()
              })
          },
          error => {
            this.escapeLoader()
            trackError(error, {
              name: 'Firestore:CommentThreads',
              message: `thread ${threadUid}; ${error && error.message}`,
            })
          }
        )
        this.listeners.push(this.commentThreadsListener)
        this.listeners.push(this.commentsListener)
      })
      .catch(e => {
        // comment_thread document does not exist
        this.escapeLoader()
      })
  }

  escapeLoader = (timeout = 2500) => {
    setTimeout(() => {
      apiStore.update('loadingThreads', false)
    }, timeout)
  }

  checkIfFinishedLoading = () => {
    if (!apiStore.loadingThreads) return
    if (this.loadedThreadIds.length === this.subscribedThreadIds.length) {
      apiStore.update('loadingThreads', false)
    }
    // just in case there was an issue loading all the threads, escape the loader after 5s
    this.escapeLoader(5000)
  }
}

export default new FirebaseClient()
