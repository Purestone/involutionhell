import { create } from "zustand";

/**
 * 编辑器状态管理 Store
 * 用于管理文章元数据、Markdown 内容和图片文件
 */
interface EditorState {
  // 文章元数据
  title: string;
  description: string;
  tags: string[];
  filename: string;

  // 编辑器内容
  markdown: string;

  // Actions
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setTags: (tags: string[]) => void;
  setFilename: (filename: string) => void;
  setMarkdown: (markdown: string) => void;

  // 重置所有状态
  reset: () => void;
}

const createInitialState = () => ({
  title: "",
  description: "",
  tags: [] as string[],
  filename: "",
  markdown: "",
});

export const useEditorStore = create<EditorState>((set) => ({
  ...createInitialState(),

  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setTags: (tags) => set({ tags }),
  setFilename: (filename) => set({ filename }),
  setMarkdown: (markdown) => set({ markdown }),
  reset: () => set(createInitialState()),
}));
