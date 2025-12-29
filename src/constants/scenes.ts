export interface SceneTip {
  title: string
  examples: string[]
  keywords: string[]
}

export const SCENE_TIPS: Record<string, SceneTip> = {
  '日常': {
    title: '日常对话场景',
    examples: [
      '我想吃水果',
      '今天天气不错',
      '谢谢你的帮助',
      '再见，下次见'
    ],
    keywords: ['问候', '感谢', '日常交流']
  },
  '工作': {
    title: '职场沟通场景',
    examples: [
      '会议改期到下午3点',
      '项目进度汇报',
      '请审核这份报告',
      '期待您的回复'
    ],
    keywords: ['邮件', '会议', '汇报']
  },
  '学习': {
    title: '学习相关场景',
    examples: [
      '这道题怎么做',
      '帮我辅导英语',
      '图书馆在哪里',
      '考试时间是什么时候'
    ],
    keywords: ['提问', '请求帮助', '校园']
  },
  '购物': {
    title: '购物消费场景',
    examples: [
      '这件衣服多少钱',
      '可以试穿吗',
      '我要退货',
      '有优惠吗'
    ],
    keywords: ['询问价格', '试穿', '支付']
  },
  '旅游': {
    title: '旅行出行场景',
    examples: [
      '最近的地铁站怎么走',
      '我想预订明天的房间',
      '这里有什么特色美食',
      '去机场需要多长时间'
    ],
    keywords: ['问路', '预订', '出行']
  }
}

export function getSceneTip(scene: string): SceneTip {
  return SCENE_TIPS[scene] || {
    title: scene,
    examples: [],
    keywords: []
  }
}
