import { defineStore } from "pinia";
import { get } from "../utils/request";
import { ref } from "vue";

export const useRankingStore = defineStore('ranking', ()=>{
    const overallRanking = ref([]);
    const weeklyRanking = ref([]);
    const friendsRanking = ref([]);
    const isLoading = ref(false);

    const fetchGlobalRanking = async (scope) => {
        isLoading.value = true;
        try {
            const responseData = await get('/rankings', {
                scope: scope,
                limit: 50,
            });
            const formattedData = responseData.items.map((item,index) => ({
                id:item.userId,
                nickname:item.nickname,
                avatar:item.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${item.nickname}`,
                score:item.minutes,
                rank: index + 1,
            }));
            if(scope === 'week'){
                weeklyRanking.value = formattedData;
            } else {
                overallRanking.value = formattedData;
            }
        } catch (error) {
            console.error(`获取${scope}排行榜失败`, error);
        } finally {
            isLoading.value = false;
        }
    };
    const fetchFriendsRanking = async () => {
        if (friendsRanking.value.length > 0) return;
        isLoading.value = true;
        try {
            const responseData = await get('/friends/rankings');
            const formattedData = responseData.items.map((item,index) => ({
                id:item.userId,
                nickname:item.nickname,
                avatar:item.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${item.nickname}`,
                score:item.minutes,
                rank: index + 1,
            }));
            friendsRanking.value = formattedData;
        } catch (error) {
            console.error(`获取好友排行榜失败:`, error);
            friendsRanking.value = [];
        } finally {
            isLoading.value = false;
        }
    }

    return {
    weeklyRanking,
    overallRanking,
    friendsRanking,
    isLoading,
    fetchGlobalRanking,
    fetchFriendsRanking,
  };

});