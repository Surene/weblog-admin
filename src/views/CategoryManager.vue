<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h2 style="margin:0;font-size:22px">Categories</h2>
      <el-button type="primary" @click="openDialog(null)">
        <el-icon><Plus /></el-icon> New Category
      </el-button>
    </div>

    <el-table :data="categories" stripe style="width:100%">
      <el-table-column prop="name" label="Name" min-width="150" />
      <el-table-column prop="slug" label="Slug" width="160" />
      <el-table-column prop="description" label="Description" min-width="200" />
      <el-table-column prop="sortOrder" label="Sort" width="80" align="center" />
      <el-table-column label="Actions" width="160" fixed="right">
        <template #default="{row}">
          <el-button size="small" @click="openDialog(row.id)">Edit</el-button>
          <el-button size="small" type="danger" @click="deleteCategory(row.id)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? 'Edit Category' : 'New Category'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="Name" required>
          <el-input v-model="form.name" placeholder="Category name" />
        </el-form-item>
        <el-form-item label="Slug">
          <el-input v-model="form.slug" placeholder="Auto-generated if empty" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="form.description" placeholder="Brief description" />
        </el-form-item>
        <el-form-item label="Sort Order">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="saveCategory">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { categoryApi } from '../api/category.js'

const categories = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const form = ref({ name:'', slug:'', description:'', sortOrder:99 })

onMounted(loadCategories)

async function loadCategories() {
  try { const r = await categoryApi.getAll(); categories.value = r.data || [] } catch(e){}
}

function openDialog(id) { editingId.value = id; form.value = id ? {...categories.value.find(c=>c.id===id)} : {name:'',slug:'',description:'',sortOrder:99}; dialogVisible.value = true }

async function saveCategory() {
  if(!form.value.name) return ElMessage.warning('Name required')
  try {
    if (editingId.value) {
      await categoryApi.update(editingId.value, { name:form.value.name, slug:form.value.slug||undefined, description:form.value.description, sortOrder:form.value.sortOrder })
    } else {
      await categoryApi.create({ name:form.value.name, slug:form.value.slug||undefined, description:form.value.description, sortOrder:form.value.sortOrder })
    }
    dialogVisible.value = false
    await loadCategories()
    ElMessage.success('Saved')
  } catch(e) { ElMessage.error('Failed: ' + e.message) }
}

async function deleteCategory(id) {
  try {
    await ElMessageBox.confirm('Delete this category?', 'Confirm', { type:'warning' })
    await categoryApi.remove(id)
    await loadCategories()
    ElMessage.success('Deleted')
  } catch(e) { if(e !== 'cancel') ElMessage.error(e.message) }
}
</script>
