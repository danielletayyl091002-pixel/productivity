import Dexie, { Table } from 'dexie'
import { nanoid } from 'nanoid'

export interface Page {
  id?: number
  uid: string
  title: string
  icon: string | null
  parentUid: string | null
  isFavorite: boolean
  inTrash: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface Block {
  id?: number
  uid: string
  pageUid: string
  type: 'text' | 'heading1' | 'heading2' | 'heading3' |
        'todo' | 'bullet' | 'numbered' | 'quote' | 'code' | 'divider'
  content: string
  checked: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface Task {
  id?: number
  uid: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'high' | 'medium' | 'low' | null
  dueDate: string | null
  scheduledDate: string | null
  startTime: string | null
  endTime: string | null
  color: string
  createdAt: string
}

export interface Setting {
  id?: number
  key: string
  value: string
}

export interface FinanceEntry {
  id?: number
  type: 'income' | 'expense'
  amount: number
  category: string
  date: string
  note: string
  createdAt: string
}

export interface FinanceCategory {
  id?: number
  name: string
  color: string
  type: 'income' | 'expense' | 'both'
  isDefault: boolean
}

class FluentDB extends Dexie {
  pages!: Table<Page>
  blocks!: Table<Block>
  tasks!: Table<Task>
  settings!: Table<Setting>
  financeEntries!: Table<FinanceEntry>
  financeCategories!: Table<FinanceCategory>

  constructor() {
    super('fluentv2')
    this.version(1).stores({
      pages: '++id, uid, parentUid, isFavorite',
      blocks: '++id, uid, pageUid, type, order',
      tasks: '++id, uid, status, dueDate, scheduledDate',
      settings: '++id, key',
      financeEntries: '++id, type, category, date',
      financeCategories: '++id, type'
    })
  }
}

export const db = new FluentDB()

export async function seedIfEmpty() {
  const existing = await db.settings.where('key').equals('seeded').first()
  if (existing) return

  const homeUid = nanoid()

  await db.pages.add({
    uid: homeUid,
    title: 'Home',
    icon: null,
    parentUid: null,
    isFavorite: true,
    inTrash: false,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  await db.blocks.bulkAdd([
    {
      uid: nanoid(), pageUid: homeUid,
      type: 'heading1', content: 'Welcome to Fluent',
      checked: false, order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      uid: nanoid(), pageUid: homeUid,
      type: 'text',
      content: "Type / to add blocks. Click + in the sidebar to create a new page.",
      checked: false, order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ])

  await db.settings.add({ key: 'seeded', value: 'true' })
  await db.settings.add({ key: 'theme', value: 'light' })
  await db.settings.add({ key: 'homePageUid', value: homeUid })
}
