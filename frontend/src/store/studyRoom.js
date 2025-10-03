import { ref } from 'vue';
import { defineStore } from 'pinia';
import { get, post } from '../utils/request';
import { useRouter } from 'vue-router';

export const useStudyRoomStore = defineStore('studyRoom', () => {


    // state
    const rooms = ref([]);
    const isLoading = ref(false);
    // actions

    // 获取房间列表
    const fetchRooms = async () => {
        isLoading.value = true;
        try {
            const responseData = await get('/rooms');
            rooms.value = Array.isArray(responseData.items) ? responseData.items : [];
        } catch (error) {
            console.error("获取房间列表失败:", error);
            rooms.value = [];
        } finally {
            isLoading.value = false;
        }
    };
    // 创建新房间
    const createRoom = async (roomData) => {
        try {
            const newRoom = await post('/rooms', roomData);
            console.log("创建房间成功:", newRoom);
                // 成功创建后，可以跳转到新房间，或者刷新列表
                // 这里我们先刷新列
            await fetchRooms();
            return true;
        } catch (error) {
            console.error("创建房间失败:", error);
            return false;
        }
    };
    return { rooms, isLoading, fetchRooms, createRoom };
})