<template>
  <div class="flex h-screen bg-base-200 text-base-content">
    <!-- 1. 左侧固定导航栏 -->
    <NavBar />
    
    <!-- 2. 主内容区域，为 NavBar 留出空间 -->
    <div class="flex-1 flex flex-col overflow-hidden pl-28">
      <div class="p-4 sm:p-6 lg:p-8 flex flex-col h-full">
        <div class="flex justify-between items-center mb-4">
            <h1 class="text-3xl font-bold mb-4 text-base-content">学习排行榜</h1>
            <!-- 3. 切换按钮区域 (已根据新要求重新设计) -->
            <div class="flex justify-start items-center gap-4 mb-6 bg-base-100 p-2 rounded-box shadow">

                <!-- 总榜/周榜 下拉框 (当非好友榜时显示) -->
            <div v-if="!isFriendsRanking" class="form-control">
                <select class="select select-sm select-bordered" v-model="activePeriod">
                <option value="overall">总榜</option>
                <option value="weekly">周榜</option>
                </select>
            </div>
            <!-- 好友榜 切换勾选框 -->
            <div class="form-control">
                <label class="cursor-pointer label gap-2">
                <span class="label-text">好友排行榜</span> 
                <input type="checkbox" class="toggle toggle-accent" v-model="isFriendsRanking" />
                </label>
            </div>
            </div>
        </div>

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
            <p class="text-sm text-base-content/70">{{ topThree[1].score }} 分</p>
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
            <p class="text-sm text-amber-500">{{ topThree[0].score }} 分</p>
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
            <p class="text-sm text-base-content/70">{{ topThree[2].score }} 分</p>
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
                <td>{{ user.score }} 分</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import NavBar from '../../components/NavBar.vue';

// --- 模拟数据 ---
const mockOverallData = Array.from({ length: 50 }, (_, i) => ({
  id: `user-o-${i + 1}`,
  nickname: `学霸No.${i + 1}`,
  avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=overall${i}`,
  score: Math.floor(10000 - i * 150 - Math.random() * 100),
  rank: i + 1,
}));

const mockWeeklyData = Array.from({ length: 50 }, (_, i) => ({
  id: `user-w-${i + 1}`,
  nickname: `卷王No.${i + 1}`,
  avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=weekly${i}`,
  score: Math.floor(1000 - i * 15 - Math.random() * 10),
  rank: i + 1,
}));

const mockFriendsData = [
  { id: 'friend-1', nickname: '张三', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=friend1', score: 980, rank: 1 },
  { id: 'friend-2', nickname: '李四', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=friend2', score: 950, rank: 2 },
  { id: 'friend-3', nickname: '王五', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=friend3', score: 850, rank: 3 },
  { id: 'friend-4', nickname: '赵六', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=friend4', score: 720, rank: 4 },
];

// --- 响应式状态 ---
const activeRanking = ref('global'); // 'global' or 'friends'
const activePeriod = ref('overall'); // 'overall' or 'weekly'

// --- 计算属性 ---

// 创建一个可写的计算属性来处理勾选框的逻辑
const isFriendsRanking = computed({
  get: () => activeRanking.value === 'friends',
  set: (value) => {
    activeRanking.value = value ? 'friends' : 'global';
  }
});

// 用于动态展示数据的计算属性
const currentLeaderboard = computed(() => {
  if (isFriendsRanking.value) {
    return mockFriendsData;
  }
  return activePeriod.value === 'overall' ? mockOverallData : mockWeeklyData;
});

const topThree = computed(() => currentLeaderboard.value.slice(0, 3));
const restOfLeaderboard = computed(() => currentLeaderboard.value.slice(3));

</script>

