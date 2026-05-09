// 群聊页面
// 功能：采集者群、核验者群的群聊功能
const messageService = require('../../../config/messageService');

Page({
  data: {
    groupId: null,
    groupName: '',
    messages: [],
    inputContent: '',
    loading: true,
    pageNum: 1,
    pageSize: 20,
    hasMore: true,
    myUserId: null,
    myNickname: '',
    scrollTop: 0
  },

  onLoad(options) {
    const { groupId, groupName } = options;
    if (groupId) {
      this.setData({
        groupId: parseInt(groupId),
        groupName: groupName || '群聊',
        myUserId: parseInt(wx.getStorageSync('userId') || '0'),
        myNickname: wx.getStorageSync('userNickname') || '我'
      });
      this.loadHistory();
      this.setupMessageListener();
    }
  },

  onShow() {
    this.scrollToBottom();
  },

  setupMessageListener() {
    messageService.addMessageListener(this.handleNewMessage.bind(this));
  },

  async loadHistory(refresh = true) {
    if (!this.data.groupId) return;

    const pageNum = refresh ? 1 : this.data.pageNum;
    this.setData({ loading: true });

    try {
      const res = await messageService.getGroupHistory(
        this.data.groupId,
        this.data.pageSize,
        (pageNum - 1) * this.data.pageSize
      );

      if (res.success) {
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
      console.error('加载群聊记录失败:', err);
      this.setData({ loading: false });
    }
  },

  markMessagesAsRead(messages) {
    const unreadUuids = messages
      .filter(m => !m.is_read && m.from_user_id !== this.data.myUserId)
      .map(m => m.msg_uuid);
    
    if (unreadUuids.length > 0) {
      messageService.markAsRead(unreadUuids);
    }
  },

  handleNewMessage(message) {
    if (message.msg_type !== 'group' || message.to_id !== this.data.groupId) return;

    this.setData({
      messages: [...this.data.messages, message]
    });
    this.scrollToBottom();
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
    if (!content || !this.data.groupId) return;

    this.setData({ inputContent: '' });

    const res = await messageService.sendGroupMessage(
      this.data.myUserId,
      this.data.groupId,
      content
    );

    if (res.success) {
      const newMessage = {
        msg_uuid: res.msg_uuid,
        msg_type: 'group',
        from_user_id: this.data.myUserId,
        from_nickname: this.data.myNickname,
        to_id: this.data.groupId,
        to_type: 'group',
        content: content,
        content_type: 'text',
        is_read: 1,
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
    messageService.removeMessageListener(this.handleNewMessage.bind(this));
  }
});
