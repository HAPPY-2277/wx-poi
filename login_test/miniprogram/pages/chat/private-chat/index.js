// 私聊页面
// 功能：采集者与核验者私聊讨论
const messageService = require('../../../config/messageService');

// 消息已读状态常量
const MSG_READ_STATUS = {
  UNREAD: 0,
  READ: 1
};

Page({
  data: {
    userId: null,
    targetId: null,
    targetName: '',
    messages: [],
    inputContent: '',
    loading: true,
    pageNum: 1,
    pageSize: 20,
    hasMore: true,
    myUserId: null,
    scrollTop: 0,
    _messageListener: null
  },

  onLoad(options) {
    const { userId } = options;
    if (userId) {
      this.setData({
        targetId: parseInt(userId),
        targetName: `用户 ${userId}`,
        myUserId: parseInt(wx.getStorageSync('userId') || '0')
      });
      this.loadHistory();
      this.setupMessageListener();
    }
  },

  onShow() {
    this.scrollToBottom();
  },

  setupMessageListener() {
    const listener = this.handleNewMessage.bind(this);
    this.setData({ _messageListener: listener });
    messageService.addMessageListener(listener);
  },

  async loadHistory(refresh = true) {
    if (!this.data.targetId) return;

    const pageNum = refresh ? 1 : this.data.pageNum;
    this.setData({ loading: true });

    try {
      const res = await messageService.getPrivateHistory(
        this.data.myUserId || 0,
        this.data.targetId,
        this.data.pageSize,
        (pageNum - 1) * this.data.pageSize
      );

      if (res.success && res.data) {
        const messages = refresh ? res.data : [...this.data.messages, ...res.data];
        this.setData({
          messages,
          pageNum: pageNum + 1,
          hasMore: res.data.length >= this.data.pageSize,
          loading: false
        });

        if (refresh) {
          this.markMessagesAsRead(res.data);
        }
      }
    } catch (err) {
      console.error('加载聊天记录失败:', err);
      this.setData({ loading: false });
    }
  },

  markMessagesAsRead(messages) {
    const unreadUuids = messages
      .filter(m => m.is_read === MSG_READ_STATUS.UNREAD && m.from_user_id !== this.data.myUserId)
      .map(m => m.msg_uuid);

    if (unreadUuids.length > 0) {
      messageService.markAsRead(unreadUuids);
    }
  },

  handleNewMessage(message) {
    if (message.msg_type !== 'private') return;

    const isRelevant = (message.from_user_id === this.data.targetId && message.to_id === this.data.myUserId) ||
                       (message.from_user_id === this.data.myUserId && message.to_id === this.data.targetId);

    if (isRelevant) {
      this.setData({
        messages: [...this.data.messages, message]
      });
      this.scrollToBottom();
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadHistory(false);
    }
  },

  onInputChange(e) {
    this.setData({ inputContent: e.detail.value });
  },

  async sendMessage() {
    const content = this.data.inputContent.trim();
    if (!content || !this.data.targetId) return;

    this.setData({ inputContent: '' });

    const res = await messageService.sendPrivateMessage(
      this.data.myUserId,
      this.data.targetId,
      content
    );

    if (res.success) {
      const newMessage = {
        msg_uuid: res.msg_uuid,
        msg_type: 'private',
        from_user_id: this.data.myUserId,
        to_id: this.data.targetId,
        to_type: 'user',
        content: content,
        content_type: 'text',
        is_read: MSG_READ_STATUS.READ,
        created_at: new Date().toISOString()
      };
      this.setData({
        messages: [...this.data.messages, newMessage]
      });
      this.scrollToBottom();
    } else {
      wx.showToast({
        title: res.message || '发送失败',
        icon: 'none'
      });
    }
  },

  scrollToBottom() {
    const query = wx.createSelectorQuery();
    query.select('.message-list').boundingClientRect((rect) => {
      if (rect) {
        this.setData({ scrollTop: rect.height });
      }
    }).exec();
  },

  onUnload() {
    if (this.data._messageListener) {
      messageService.removeMessageListener(this.data._messageListener);
    }
  }
});
