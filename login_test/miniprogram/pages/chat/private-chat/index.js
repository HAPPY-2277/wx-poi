// 私聊页面
// 功能：采集者与核验者私聊讨论
const messageService = require('../../../config/messageService');
const { getAvatarByUserInfo } = require('../../../utils/avatar');

Page({
  data: {
    userId: null,
    targetId: null,
    targetName: '',
    targetRole: '',
    messages: [],
    inputContent: '',
    loading: true,
    pageNum: 1,
    pageSize: 20,
    hasMore: true,
    myUserId: null,
    myRole: '',
    scrollTop: 0,
    _messageListener: null
  },

  onLoad(options) {
    console.log('[私聊页面] onLoad options:', JSON.stringify(options));
    console.log('[私聊页面] storage中的userId:', wx.getStorageSync('userId'));
    console.log('[私聊页面] storage中的userRole:', wx.getStorageSync('userRole'));
    
    const { userId, nickname, role } = options;
    if (userId) {
      console.log('[私聊页面] URL参数 userId:', userId, '类型:', typeof userId);
      
      this.setData({
        targetId: userId,
        targetName: nickname ? decodeURIComponent(nickname) : `用户 ${userId}`,
        targetRole: role || 'unknown',
        myUserId: wx.getStorageSync('userId'),
        myRole: wx.getStorageSync('userRole') || ''
      });
      console.log('[私聊页面] setData后的targetId:', this.data.targetId, 'myUserId:', this.data.myUserId);
      this.loadHistory();
      this.setupMessageListener();
    } else {
      console.log('[私聊页面] 错误：userId参数为空');
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
      .filter(m => m.is_read === 0 && m.from_user_id !== this.data.myUserId)
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
    console.log('[私聊页面] sendMessage调用');
    console.log('[私聊页面] inputContent:', content);
    console.log('[私聊页面] targetId:', this.data.targetId);
    console.log('[私聊页面] myUserId:', this.data.myUserId);
    console.log('[私聊页面] targetId是否为NaN:', Number.isNaN(this.data.targetId));
    console.log('[私聊页面] myUserId是否为NaN:', Number.isNaN(this.data.myUserId));
    
    if (!content || !this.data.targetId) {
      console.log('[私聊页面] 发送失败：内容或targetId为空');
      return;
    }

    this.setData({ inputContent: '' });

    console.log('[私聊页面] 调用messageService.sendPrivateMessage，参数:', {
      fromUserId: this.data.myUserId,
      toUserId: this.data.targetId,
      content: content
    });

    const res = await messageService.sendPrivateMessage(
      this.data.myUserId,
      this.data.targetId,
      content
    );

    console.log('[私聊页面] sendPrivateMessage返回结果:', JSON.stringify(res));

    if (res.success) {
      const newMessage = {
        msg_uuid: res.msg_uuid,
        msg_type: 'private',
        from_user_id: this.data.myUserId,
        to_id: this.data.targetId,
        to_type: 'user',
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
    if (this.data._messageListener) {
      messageService.removeMessageListener(this.data._messageListener);
    }
  },

  getAvatar(role) {
    return getAvatarByUserInfo({ role: role || 'unknown' });
  }
});