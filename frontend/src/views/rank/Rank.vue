<template>
  <div class="flex h-screen bg-base-200 text-base-content">
    <!-- 1. 左侧固定导航栏 -->
    <NavBar />
    
    <!-- 2. 主内容区域 -->
    <div class="flex-1 flex flex-col overflow-hidden pl-28">
      <div class="p-4 sm:p-6 lg:p-8 flex flex-col h-full">
        
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-3xl font-bold text-base-content">学习排行榜</h1>
          <!-- 3. 筛选器区域 -->
          <div class="flex justify-start items-center gap-4 bg-base-100 p-2 rounded-box shadow">
            <div v-if="!isFriendsRanking" class="form-control">
              <select class="select select-sm select-bordered" v-model="activePeriod">
                <option value="overall">总榜</option>
                <option value="weekly">周榜</option>
              </select>
            </div>
            <div class="form-control">
              <label class="cursor-pointer label gap-2">
                <span class="label-text">好友排行榜</span> 
                <input type="checkbox" class="toggle toggle-accent" v-model="isFriendsRanking" />
              </label>
            </div>
          </div>
        </div>

        <!-- 【新增】Loading 状态 -->
        <div v-if="rankingStore.isLoading" class="flex-1 flex items-center justify-center">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <!-- 数据展示区域 -->
        <div v-else class="flex flex-col flex-1 min-h-0">
          <!-- 4. 颁奖台区域 -->
          <div class="flex justify-center items-end gap-2 md:gap-4 p-4 md:p-8 min-h-[280px]">
            <!-- 第二名 -->
            <div v-if="topThree[1]" class="text-center flex flex-col items-center w-1/4">
              <div class="avatar relative">
                <div class="w-16 md:w-24 rounded-full ring-2 ring-slate-400 ring-offset-base-100 ring-offset-4">
                  <img :src="topThree[1].avatar" :alt="topThree[1].nickname" />
                </div>
                <div class="absolute -top-2 -right-2 text-2xl">🥈</div>
              </div>
              <p class="font-bold mt-2 truncate">{{ topThree[1].nickname }}</p>
              <!-- 【修改】单位改为分钟 -->
              <p class="text-sm text-base-content/70">{{ topThree[1].score }} 分钟</p>
              <div class="bg-slate-400 text-slate-800 w-full p-2 mt-2 rounded-t-lg h-16 md:h-24 font-bold text-2xl flex items-center justify-center">2</div>
            </div>

            <!-- 第一名 -->
            <div v-if="topThree[0]" class="text-center flex flex-col items-center w-1/3">
              <div class="avatar relative">
                <div class="w-20 md:w-32 rounded-full ring-2 ring-amber-400 ring-offset-base-100 ring-offset-4">
                  <img :src="topThree[0].avatar" :alt="topThree[0].nickname" />
                </div>
                <div class="absolute -top-3 -right-3 text-4xl">🥇</div>
              </div>
              <p class="font-bold mt-2 truncate text-lg">{{ topThree[0].nickname }}</p>
              <!-- 【修改】单位改为分钟 -->
              <p class="text-sm text-amber-500">{{ topThree[0].score }} 分钟</p>
              <div class="bg-amber-400 text-amber-800 w-full p-4 mt-2 rounded-t-lg h-24 md:h-40 font-bold text-4xl flex items-center justify-center">1</div>
            </div>
            
            <!-- 第三名 -->
            <div v-if="topThree[2]" class="text-center flex flex-col items-center w-1/4">
               <div class="avatar relative">
                <div class="w-16 md:w-24 rounded-full ring-2 ring-yellow-700 ring-offset-base-100 ring-offset-4">
                  <img :src="topThree[2].avatar" :alt="topThree[2].nickname" />
                </div>
                <div class="absolute -top-2 -right-2 text-2xl">🥉</div>
              </div>
              <p class="font-bold mt-2 truncate">{{ topThree[2].nickname }}</p>
              <!-- 【修改】单位改为分钟 -->
              <p class="text-sm text-base-content/70">{{ topThree[2].score }} 分钟</p>
              <div class="bg-yellow-700 text-yellow-100 w-full p-2 mt-2 rounded-t-lg h-16 md:h-20 font-bold text-2xl flex items-center justify-center">3</div>
            </div>
          </div>

          <!-- 5. 之后的用户列表 -->
          <div class="flex-1 overflow-y-auto bg-base-100 p-4 rounded-box shadow-inner">
            <table class="table table-sm">
              <tbody>
                <tr v-for="user in restOfLeaderboard" :key="user.id" class="hover">
                  <th>{{ user.rank }}</th>
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="avatar">
                        <div class="mask mask-squircle w-10 h-10">
                          <img :src="user.avatar" :alt="user.nickname" />
                        </div>
                      </div>
                      <div>
                        <div class="font-bold">{{ user.nickname }}</div>
                      </div>
                    </div>
                  </td>
                  <!-- 【修改】单位改为分钟 -->
                  <td>{{ user.score }} 分钟</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'; // 移除了未使用的 onMounted
import NavBar from '../../components/NavBar.vue';
import { useRankingStore } from '../../store/ranking'; 

const rankingStore = useRankingStore();

const activePeriod = ref('overall');
const isFriendsRanking = ref(false);

const currentLeaderboard = computed(() => {
  if (isFriendsRanking.value) {
    return rankingStore.friendsRanking;
  }
  return activePeriod.value === 'overall' ? rankingStore.overallRanking : rankingStore.weeklyRanking;
});

const topThree = computed(() => currentLeaderboard.value.slice(0, 3));
const restOfLeaderboard = computed(() => currentLeaderboard.value.slice(3));


// --- 【修复】统一的侦听器 ---
// 使用一个侦听器来观察所有相关的筛选条件
watch([activePeriod, isFriendsRanking], () => {
  if (isFriendsRanking.value) {
    // 如果是好友榜，调用好友榜的接口
    rankingStore.fetchFriendsRanking();
  } else {
    // 否则，根据周榜/总榜的状态调用对应的接口
    const scope = activePeriod.value === 'weekly' ? 'week' : 'all';
    rankingStore.fetchGlobalRanking(scope);
  }
}, { immediate: true }); // immediate: true 确保组件加载时立即获取初始数据

</script>

