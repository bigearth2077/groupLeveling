
import { useState, useEffect, useRef } from 'react';
import { fetchUser, updateUser, addTag, removeTag } from '../api/index';

export const useProfile = (isOpen) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false); // 新增状态
  
  // 用于追踪上一次保存的服务器数据，以便判断是否有变更
  const lastSavedUserInfo = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // 每次打开时重新获取数据，保证数据新鲜度
      setLoading(true);
      fetchUser()
        .then(data => {
          setUserInfo(data);
          lastSavedUserInfo.current = data; // 初始化基准数据
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to load profile:", err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  const handleUpdate = async (newData) => {
    // 1. 立即更新 UI (Optimistic)
    setUserInfo(newData);

    // 2. 检查是否有实质性变更 (对比上次保存的数据)
    const original = lastSavedUserInfo.current || {};
    
    // 检查 Profile 字段变更
    const hasProfileChange = 
      newData.nickname !== original.nickname || 
      newData.bio !== original.bio ||
      newData.avatar !== original.avatar;

    if (hasProfileChange) {
      try {
        const updatedProfile = await updateUser(newData);
        // 使用服务器返回的最新数据更新基准和状态
        const mergedData = { ...newData, ...updatedProfile };
        setUserInfo(mergedData);
        lastSavedUserInfo.current = { ...lastSavedUserInfo.current, ...mergedData };
        console.log("Profile updated successfully");
      } catch (error) {
        console.error("Update failed:", error);
        alert("保存失败，请重试");
        // 回滚 UI
        setUserInfo(lastSavedUserInfo.current);
      }
    }
  };

  // 确认添加标签
  const confirmAddTag = async (tagName) => {
    if (!tagName.trim()) {
      setIsAddingTag(false);
      return;
    }
    
    if (userInfo.tags.includes(tagName)) {
      alert("标签已存在");
      setIsAddingTag(false);
      return;
    }

    try {
      const newTagObj = await addTag(tagName);
      // 假设后端返回完整的 tag 对象 { tagId, tagName, ... }
      // 前端需要同时更新 tags (string[]) 和 _rawTags (object[])
      
      const newTags = [...userInfo.tags, newTagObj.tagName];
      const newRawTags = [...(userInfo._rawTags || []), newTagObj];

      const updatedUserInfo = {
        ...userInfo,
        tags: newTags,
        _rawTags: newRawTags
      };

      setUserInfo(updatedUserInfo);
      lastSavedUserInfo.current = updatedUserInfo;
      setIsAddingTag(false);
    } catch (error) {
      console.error("Failed to add tag:", error);
      alert("添加标签失败");
    }
  };

  // 移除标签
  const handleRemoveTag = async (tagToRemove) => {
    if (!confirm(`确定要删除标签 #${tagToRemove} 吗？`)) return;

    // 找到对应的 tagId
    const tagObj = (userInfo._rawTags || []).find(t => t.tagName === tagToRemove);
    if (!tagObj || !tagObj.tagId) {
      console.error("Tag ID not found for:", tagToRemove);
      // Fallback: 如果找不到 ID (可能是本地 mock 数据遗留)，仅前端删除
      const newTags = userInfo.tags.filter(t => t !== tagToRemove);
      setUserInfo({ ...userInfo, tags: newTags });
      return;
    }

    try {
      await removeTag(tagObj.tagId);
      
      const newTags = userInfo.tags.filter(t => t !== tagToRemove);
      const newRawTags = userInfo._rawTags.filter(t => t.tagId !== tagObj.tagId);

      // 减去被删除标签的 totalMinutes，并按小时向下取整
      // 注意：这里需要重新计算总时长，而不仅仅是减去小时数，以保证精度
      // 从当前的 _rawTags 计算总时长 (减去被删除的)
      const currentTotalMinutes = newRawTags.reduce((sum, t) => sum + (t.totalMinutes || 0), 0);
      const newFocusHours = Math.floor(currentTotalMinutes / 60);

      const updatedUserInfo = {
        ...userInfo,
        tags: newTags,
        _rawTags: newRawTags,
        focusHours: newFocusHours
      };

      setUserInfo(updatedUserInfo);
      lastSavedUserInfo.current = updatedUserInfo;
    } catch (error) {
      console.error("Failed to remove tag:", error);
      alert("删除标签失败");
    }
  };

  // 触发添加模式
  const handleAddTag = () => {
    setIsAddingTag(true);
  };

  const toggleSettings = () => setShowSettings(prev => !prev);
  const closeSettings = () => setShowSettings(false);

  return {
    userInfo,
    setUserInfo,
    loading,
    showSettings,
    isAddingTag,
    setIsAddingTag,
    handleUpdate,
    confirmAddTag,
    handleAddTag,
    handleRemoveTag,
    toggleSettings,
    closeSettings,
    setShowSettings
  };
};
