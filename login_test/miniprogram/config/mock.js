// Mock 数据配置
// 基于 PROJECT_API_AND_SCHEMA.md 后端接口文档
// MOCK_ENABLED = true 启用模拟数据

const MOCK_USER_ID = 'mock_user_' + Date.now();

const MOCK_POI_LIST = [
  {
    id: 'poi_001',
    name: '星巴克咖啡厅',
    category: 'catering',
    description: '全球知名连锁咖啡店',
    longitude: 114.292,
    latitude: 30.608,
    address: '武汉市江汉区建设大道568号',
    collectorId: MOCK_USER_ID,
    createdAt: '2024-01-10T10:00:00+08:00',
    updatedAt: '2024-01-10T10:00:00+08:00'
  },
  {
    id: 'poi_002',
    name: '中百仓储超市',
    category: 'shopping',
    description: '大型超市',
    longitude: 114.271,
    latitude: 30.534,
    address: '武汉市武昌区中南路7号',
    collectorId: MOCK_USER_ID,
    createdAt: '2024-01-12T14:00:00+08:00',
    updatedAt: '2024-01-12T14:00:00+08:00'
  }
];

const MOCK_TASK_LIST = [
  {
    id: 'task_001',
    publisherId: 'verifier_001',
    poiId: null,
    description: '需要采集一个新的POI',
    status: 'PENDING_COLLECTION',
    assigneeCount: 2,
    createdAt: '2024-01-15T09:00:00+08:00',
    updatedAt: '2024-01-15T09:00:00+08:00',
    taskType: 'CREATE_NEW',
    targetName: '待采集POI',
    targetCategory: '餐饮',
    targetLongitude: 114.292,
    targetLatitude: 30.608,
    targetAddress: '武汉市江汉区建设大道'
  },
  {
    id: 'task_002',
    publisherId: 'verifier_001',
    poiId: 'poi_003',
    description: '更新已有POI信息',
    status: 'PENDING_REVIEW',
    assigneeCount: 1,
    createdAt: '2024-01-14T16:00:00+08:00',
    updatedAt: '2024-01-14T16:00:00+08:00',
    taskType: 'UPDATE_EXISTING',
    targetName: '原POI名称',
    targetCategory: '购物',
    targetLongitude: 114.300,
    targetLatitude: 30.550,
    targetAddress: '武汉市洪山区'
  }
];

const MOCK_SUBMISSION_LIST = [
  {
    id: 'sub_001',
    poiId: null,
    submitterId: MOCK_USER_ID,
    submissionType: 'CREATE',
    name: '星巴克咖啡厅',
    category: 'catering',
    description: '全球知名连锁咖啡店，提供各式咖啡饮品和甜点',
    longitude: 114.292,
    latitude: 30.608,
    address: '武汉市江汉区建设大道568号',
    status: 'PENDING_REVIEW',
    isActive: false,
    reviewComment: null,
    reviewerId: null,
    reviewedAt: null,
    createdAt: '2024-01-15T10:30:00+08:00',
    updatedAt: '2024-01-15T10:30:00+08:00',
    taskId: 'task_001',
    photos: [
      'https://picsum.photos/800/600?random=1',
      'https://picsum.photos/800/600?random=2',
      'https://picsum.photos/800/600?random=3'
    ]
  },
  {
    id: 'sub_002',
    poiId: 'poi_003',
    submitterId: 'collector_002',
    submissionType: 'UPDATE',
    name: '更新后的名称',
    category: 'shopping',
    description: '更新后的描述',
    longitude: 114.310,
    latitude: 30.560,
    address: '武汉市洪山区更新后地址',
    status: 'APPROVED',
    isActive: true,
    reviewComment: '审核通过',
    reviewerId: 'verifier_001',
    reviewedAt: '2024-01-14T18:00:00+08:00',
    createdAt: '2024-01-14T14:00:00+08:00',
    updatedAt: '2024-01-14T18:00:00+08:00',
    taskId: 'task_002',
    photos: [
      'https://picsum.photos/800/600?random=4',
      'https://picsum.photos/800/600?random=5'
    ]
  }
];

module.exports = {
  MOCK_ENABLED: false,
  MOCK_USER_ID,

  RESPONSES: {
    '/api/auth/login': (data) => {
      if (!data.code) {
        return { success: false, code: 400, message: '缺少code参数' };
      }
      return {
        success: true,
        code: 200,
        message: '登录成功',
        data: {
          isNewUser: false,
          loginToken: 'mock_token_' + Date.now(),
          userId: MOCK_USER_ID,
          nickname: '测试用户',
          role: 'collector',
          avatar: '/images/icons/avatar.png'
        }
      };
    },

    '/api/auth/register': (data) => {
      if (!data.code || !data.nickname) {
        return { success: false, code: 400, message: '缺少必填参数' };
      }
      return {
        success: true,
        code: 200,
        message: '注册成功',
        data: {
          isNewUser: true,
          loginToken: 'mock_token_' + Date.now(),
          userId: MOCK_USER_ID,
          nickname: data.nickname,
          role: data.role || 'collector',
          avatar: data.avatarUrl || '/images/icons/avatar.png'
        }
      };
    },

    '/api/users/ids': {
      success: true,
      code: 200,
      message: '获取成功',
      data: [
        {
          id: 'user_collector_001',
          nickname: '张三',
          role: 'collector',
          lastLoginAt: '2026-05-12T10:30:00+08:00',
          createdAt: '2026-01-15T08:00:00+08:00',
          online: true
        },
        {
          id: 'user_collector_002',
          nickname: '李四',
          role: 'collector',
          lastLoginAt: '2026-05-11T15:20:00+08:00',
          createdAt: '2026-02-01T09:00:00+08:00',
          online: false
        },
        {
          id: 'user_verifier_001',
          nickname: '王核验',
          role: 'verifier',
          lastLoginAt: '2026-05-13T08:00:00+08:00',
          createdAt: '2025-12-20T14:00:00+08:00',
          online: true
        },
        {
          id: 'user_verifier_002',
          nickname: '赵审核',
          role: 'verifier',
          lastLoginAt: '2026-05-10T11:00:00+08:00',
          createdAt: '2026-01-05T10:00:00+08:00',
          online: false
        }
      ]
    },

    '/api/poi': {
      success: true,
      code: 200,
      message: '获取成功',
      data: MOCK_POI_LIST
    },

    '/api/poi/collector/*': (collectorId) => {
      const list = MOCK_POI_LIST.filter(p => p.collectorId === collectorId);
      return {
        success: true,
        code: 200,
        message: '获取成功',
        data: list.length > 0 ? list : MOCK_POI_LIST
      };
    },

    '/api/poi/submission': {
      success: true,
      code: 200,
      message: '获取成功',
      data: MOCK_SUBMISSION_LIST
    },

    '/api/task': {
      success: true,
      code: 200,
      message: '任务发布成功',
      data: null
    },

    '/api/task/collector/*': (collectorId) => {
      console.log('[Mock] 获取采集者任务列表:', collectorId);
      return {
        success: true,
        code: 200,
        message: '获取成功',
        data: MOCK_TASK_LIST.map(task => ({
          ...task,
          id: task.id,
          publisherId: task.publisherId,
          poiId: task.poiId,
          description: task.description,
          status: task.status,
          assigneeCount: task.assigneeCount,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          taskType: task.taskType,
          targetName: task.targetName,
          targetCategory: task.targetCategory,
          targetLongitude: task.targetLongitude,
          targetLatitude: task.targetLatitude,
          targetAddress: task.targetAddress
        }))
      };
    },

    '/api/task/pending-review': {
      success: true,
      code: 200,
      message: '获取成功',
      data: MOCK_TASK_LIST.filter(t => t.status === 'PENDING_REVIEW')
    },

    '/api/submission': {
      success: true,
      code: 200,
      message: '提交成功',
      data: { id: 'sub_new_' + Date.now() }
    },

    '/api/submission/pending-review': {
      success: true,
      code: 200,
      message: '获取成功',
      data: MOCK_SUBMISSION_LIST.filter(s => s.status === 'PENDING_REVIEW')
    },

    '/api/submission/task/*': (taskId) => {
      const list = MOCK_SUBMISSION_LIST.filter(s => s.taskId === taskId);
      return {
        success: true,
        code: 200,
        message: '获取成功',
        data: list.length > 0 ? list : MOCK_SUBMISSION_LIST
      };
    },

    '/api/submission/submitter/*': (submitterId) => {
      const list = MOCK_SUBMISSION_LIST.filter(s => s.submitterId === submitterId);
      return {
        success: true,
        code: 200,
        message: '获取成功',
        data: list.length > 0 ? list : MOCK_SUBMISSION_LIST
      };
    },

    '/api/submission/*/approve': {
      success: true,
      code: 200,
      message: '审核通过',
      data: null
    },

    '/api/submission/*/reject': {
      success: true,
      code: 200,
      message: '审核驳回',
      data: null
    },

    '/api/submission/resubmit': {
      success: true,
      code: 200,
      message: '重新提交成功',
      data: null
    },

    '/api/submission/*': (submissionId) => {
      const submission = MOCK_SUBMISSION_LIST.find(s => s.id === submissionId);
      if (submission) {
        return {
          success: true,
          code: 200,
          message: '获取成功',
          data: submission
        };
      }
      return {
        success: false,
        code: 404,
        message: '提交不存在',
        data: null
      };
    }
  },

  MSG_RESPONSES: {
    '/api/messages/send': {
      code: 0,
      msg: '发送成功',
      msg_uuid: 'mock_msg_' + Date.now()
    },

    '/api/messages/unread': {
      code: 0,
      data: [
        {
          msg_uuid: 'msg_001',
          msg_type: 'private',
          from_user_id: 'user_1001',
          to_id: null,
          content: '你好，请帮我审核一下这个POI',
          created_at: '2024-01-15T10:30:00Z',
          is_read: false
        },
        {
          msg_uuid: 'msg_002',
          msg_type: 'system',
          from_user_id: 0,
          to_id: null,
          content: '您有新的采集任务',
          created_at: '2024-01-15T09:00:00Z',
          is_read: false
        }
      ]
    },

    '/api/messages/read': {
      code: 0,
      msg: '标记成功'
    },

    '/api/messages/history/private': {
      code: 0,
      data: [
        {
          msg_uuid: 'h001',
          msg_type: 'private',
          from_user_id: 'user_1001',
          to_id: null,
          content: '这条POI数据需要重新采集',
          created_at: '2024-01-14T16:00:00Z'
        },
        {
          msg_uuid: 'h002',
          msg_type: 'private',
          from_user_id: null,
          to_id: 'user_1001',
          content: '好的，我会重新采集',
          created_at: '2024-01-14T16:30:00Z'
        }
      ]
    },

    '/api/messages/history/group': {
      code: 0,
      data: [
        {
          msg_uuid: 'g001',
          msg_type: 'group',
          from_user_id: 'user_1002',
          to_id: 1,
          from_nickname: '张三',
          content: '大家注意，今天有新任务',
          created_at: '2024-01-15T08:00:00Z'
        }
      ]
    },

    '/api/messages/objection': {
      code: 0,
      msg: '异议已提交'
    }
  }
};