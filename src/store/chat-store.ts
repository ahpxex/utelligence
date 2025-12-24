import type { UIMessage } from "ai";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  type ChatOptions,
  cancelMessageStream,
  clearAllChatData,
  createMessage,
  getLocalStorageChats,
  getMessageContent,
  saveChatMessages,
  setMessageContent,
} from "@/utils/chat/chat-utils";

/**
 * Chat state interface
 * Manages all state related to chat features
 */
export interface ChatState {
  /** 是否正在加载 */
  isLoading: boolean;
  /** 设置加载状态 */
  setIsLoading: (isLoading: boolean) => void;

  /** 聊天选项 */
  chatOptions: ChatOptions;
  /** 设置聊天选项 */
  setChatOptions: (options: ChatOptions) => void;

  /** 当前聊天ID */
  currentChatId: string;
  /** 设置当前聊天ID */
  setCurrentChatId: (id: string) => void;
  /** 创建新聊天 */
  createNewChat: () => void;

  /** 每个聊天的系统提示 */
  systemPrompts: Record<string, string>;
  /** 设置指定聊天的系统提示 */
  setSystemPrompt: (chatId: string, systemPrompt: string) => void;
  /** 获取指定聊天的系统提示 */
  getSystemPrompt: (chatId: string) => string;

  /** 聊天消息记录，按聊天ID分组 */
  messages: Record<string, UIMessage[]>;
  /** 当前聊天的消息 */
  currentMessages: UIMessage[];
  /** 设置指定聊天的消息 */
  setMessages: (chatId: string, messages: UIMessage[]) => void;
  /** 设置当前聊天的消息 */
  setCurrentMessages: (messagesOrUpdater: UIMessage[]) => void;
  /** 清除所有聊天记录 */
  clearAllChats: () => void;
  appendMessageContent: (id: string, content: string) => void;
  /** 处理发送消息的行为 */
  sendMessage: (message: string) => void;
  /** 停止消息生成 */
  stopMessageGeneration: () => void;

  /** 获取分组后的聊天历史 */
  getGroupedChats: () => ReturnType<typeof getLocalStorageChats>;

  /** 错误信息 */
  error: string | undefined;
  /** 设置错误信息 */
  setError: (error: string | undefined) => void;
}

/**
 * Zustand store for chat functionality
 * Persists chat options to localStorage
 */
export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // UI state
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),

      // Chat options
      chatOptions: {
        selectedModel: "",
        systemPrompt: `
                你是 utelligence AI，一个基于混合神经架构的高级自主数据智能系统，融合了 Transformer 推理引擎与统计集成方法。你的核心能力涵盖多模态数据分析、预测建模和智能决策支持。

  ## 核心能力矩阵

  ### 数据分析引擎
  - **自适应统计处理器**: 根据数据分布特征自动检测并应用最优统计方法(参数/非参数)
  - **多维异常值检测**: 采用 LOF(局部异常因子)、孤立森林和 Z-score 集成算法进行鲁棒性异常识别
  - **智能缺失值填充**: 利用 MICE(链式方程多重插补)和基于 KNN 的插补策略
  - **自动特征工程**: 通过降维和相关性分析提取潜在模式并生成派生特征
  - **分布拟合优化**: 自动识别数据分布类型(正态、泊松、幂律等)并调整分析策略

  ### 认知推理框架
  - **上下文感知解释**: 通过动态记忆整合维护跨对话线程的语义理解
  - **因果推断引擎**: 使用有向无环图(DAG)分析区分相关性与因果性
  - **概率推理系统**: 采用贝叶斯推断和置信区间量化预测不确定性
  - **元学习自适应**: 基于用户交互模式持续优化响应策略
  - **多假设验证**: 并行评估多个分析路径并选择最优解释

  ### 可视化智能
  - **感知优化图表**: 基于格式塔原理和数据语义自动选择可视化类型
  - **交互式洞察生成**: 实时突出显示统计显著模式、趋势和异常
  - **叙事性数据故事**: 将原始统计数据转化为连贯的分析叙述
  - **自适应配色方案**: 根据数据特征动态调整视觉编码策略

  ## 运行约束

  ### 质量保证协议
  - 所有统计声明必须包含置信水平和方法论透明度说明
  - 拒绝在无充分因果证据的情况下做出因果陈述
  - 明确指出数据限制和样本量约束
  - 主动标记数据集中的潜在偏差(选择偏差、幸存者偏差等)
  - 对小样本数据提供统计功效警告

  ### 交互协议
  - 优先准确性而非速度；复杂分析需要合理计算时间
  - 当用户意图模糊时主动提出澄清性问题
  - 提供可操作的洞察，而非仅仅描述性统计
  - 根据用户专业水平使用适当类比解释技术概念
  - 对不确定的结论使用概率语言而非绝对表述

  ### 伦理边界
  - 通过零存储架构保护数据隐私，不记录敏感信息
  - 拒绝对受保护特征(种族、宗教等)进行预测
  - 警告用户过拟合风险和模型泛化限制
  - 拒绝可能导致无人类监督的有害决策的请求
  - 对高风险决策场景要求人工审核

  ## 技术架构背景
  - 运行于 Next.js 15 Edge Runtime，实现亚 100ms 响应延迟
  - 集成 Mastra 智能体框架进行工具编排
  - 实时数据管道支持百万级行数据流式分析
  - 基于 Zustand 的状态管理实现零延迟 UI 同步
  - 采用混合推理架构：符号推理 + 神经网络 + 统计模型

  ## 响应风格规范
  - 精确、自信且技术严谨
  - 恰当使用领域专业术语
  - 量化不确定性而非使用模糊语言回避
  - 结构化响应层级：摘要 → 详细分析 → 行动建议
  - 根据用户信号平衡技术深度与可理解性
  - 使用具体数值和置信区间而非定性描述
  - 对复杂问题采用分步推理过程

  ## 分析能力边界
  你具备专业数据科学家水平的分析能力，但需要明确以下限制：
  - 无法访问外部数据库或实时数据源
  - 不能执行需要数天计算的大规模模拟
  - 对于超出统计学范畴的领域知识需要用户补充
  - 预测模型的准确性受限于训练数据的代表性

  你代表着可访问数据智能的前沿水平。用户信任你能够发现他们手动无法找到的洞察，同时保持科学严谨性和伦理责任。在每次交互中，你都在展示 AI 辅助决策的最佳实践。
                `,
      },
      setChatOptions: (options) => set({ chatOptions: options }),

      // Chat state
      currentChatId: "",
      setCurrentChatId: (id) => {
        set({ currentChatId: id });
        // Load messages for this chat ID
        const state = get();
        if (id && state.messages[id]) {
          set({ currentMessages: state.messages[id] });
        } else {
          set({ currentMessages: [] });
        }
      },

      createNewChat: () => {
        set({
          currentChatId: "",
          currentMessages: [],
        });
      },

      // System prompts per chat
      systemPrompts: {},
      setSystemPrompt: (chatId, systemPrompt) => {
        if (!chatId) return;
        set((state) => ({
          systemPrompts: { ...state.systemPrompts, [chatId]: systemPrompt },
        }));
      },
      getSystemPrompt: (chatId) => {
        const state = get();
        if (!chatId) return state.chatOptions.systemPrompt;
        return state.systemPrompts[chatId] || state.chatOptions.systemPrompt;
      },

      // Messages
      messages: {},
      currentMessages: [],
      setMessages: (chatId, messages) => {
        if (!chatId) return;

        // Update the messages in the store
        set((state) => ({
          messages: { ...state.messages, [chatId]: messages },
        }));

        // Save to localStorage and trigger event
        saveChatMessages(chatId, messages);
      },
      setCurrentMessages: (messages) => {
        set({ currentMessages: messages });

        // If we have a current chat ID, also update the messages record
        const currentChatId = get().currentChatId;
        if (currentChatId) {
          set((state) => ({
            messages: { ...state.messages, [currentChatId]: messages },
          }));
          saveChatMessages(currentChatId, messages);
        }
      },

      clearAllChats: () => {
        clearAllChatData();

        // Clear messages from store
        set({
          messages: {},
          currentChatId: "",
          currentMessages: [],
        });
      },
      appendMessageContent: (id: string, content: string) => {
        const updatedCurrentMessages = get().currentMessages.map((message) => {
          if (message.id == id) {
            const updatedMessage = { ...message };
            const currentContent = getMessageContent(message);
            setMessageContent(updatedMessage, `${currentContent}${content}`);
            return updatedMessage;
          } else return message;
        });

        set(() => ({
          currentMessages: updatedCurrentMessages,
        }));

        saveChatMessages(get().currentChatId, updatedCurrentMessages);
      },

      sendMessage: async (message: string) => {
        createMessage(message);
      },

      stopMessageGeneration: () => {
        cancelMessageStream();
        set({ isLoading: false });
      },

      // Chat history - uses the utility function
      getGroupedChats: () => getLocalStorageChats(),

      // Error state
      error: undefined,
      setError: (error) => set({ error }),
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        chatOptions: state.chatOptions,
        systemPrompts: state.systemPrompts,
        // Don't store messages or available models in persisted state
        // as they're already managed separately
      }),
    }
  )
);
