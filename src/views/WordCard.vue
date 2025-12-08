<template>
  <div class="word-card-container">
    <div class="header">
      <h1>中小学衔接版单词卡</h1>
      <div class="difficulty-filter">
        <button 
          v-for="level in difficultyLevels" 
          :key="level.value"
          :class="['difficulty-btn', { active: selectedLevel === level.value }]"
          @click="selectedLevel = level.value"
        >
          {{ level.label }}
        </button>
      </div>
    </div>
    
    <div class="card-wrapper" @click="flipCard">
      <div class="card" :class="{ flipped: isFlipped }">
        <!-- 正面 -->
        <div class="card-face front">
          <div class="word-header">
            <h2 class="word">{{ currentWord.word }}</h2>
            <p class="phonetic">{{ currentWord.phonetic }}</p>
          </div>
          
          <div class="part-of-speech">
            <span 
              v-for="(pos, index) in currentWord.posList" 
              :key="index"
              :class="['pos-tag', pos.color]"
            >
              {{ pos.type }} {{ pos.meaning }}
            </span>
          </div>
          
          <div class="difficulty">
            <span v-for="n in currentWord.difficulty" :key="n" class="star">★</span>
            <span v-for="n in (3 - currentWord.difficulty)" :key="n + 3" class="star empty">☆</span>
            <span class="difficulty-text">{{ difficultyText }}</span>
          </div>
          
          <div class="image-placeholder">
            <span class="image-icon">🖼️</span>
            <span>卡通简笔画</span>
          </div>
        </div>
        
        <!-- 背面 -->
        <div class="card-face back">
          <div class="back-header">
            <h3>{{ currentWord.word }}</h3>
            <span class="part-of-speech-tag" :class="currentWord.mainPos.color">
              {{ currentWord.mainPos.type }}
            </span>
          </div>
          
          <!-- 常考短语 -->
          <div class="module">
            <div class="module-header">
              <span class="module-icon">📚</span>
              <h4>学段常考短语</h4>
            </div>
            <div class="phrases">
              <div v-if="currentWord.phrases.junior.length > 0" class="phrase-section">
                <h5>初中必背</h5>
                <ul>
                  <li v-for="(phrase, index) in currentWord.phrases.junior" :key="index">
                    {{ phrase }}
                  </li>
                </ul>
              </div>
              <div v-if="currentWord.phrases.senior.length > 0" class="phrase-section">
                <h5>高中拓展</h5>
                <ul>
                  <li v-for="(phrase, index) in currentWord.phrases.senior" :key="index">
                    {{ phrase }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <!-- 动词特殊模块 -->
          <div v-if="currentWord.mainPos.type === '动词(v.)'" class="module">
            <div class="module-header">
              <span class="module-icon">⏳</span>
              <h4>时态变化表</h4>
            </div>
            <div class="tense-table">
              <div class="tense-row">
                <span class="tense-label">原形</span>
                <span class="tense-value">{{ currentWord.tenseForm.base }}</span>
              </div>
              <div class="tense-row">
                <span class="tense-label">过去式</span>
                <span class="tense-value" :class="{ special: currentWord.tenseForm.past.special }">
                  {{ currentWord.tenseForm.past.value }}
                  <span v-if="currentWord.tenseForm.past.special" class="special-mark">★</span>
                </span>
              </div>
              <div class="tense-row">
                <span class="tense-label">过去分词</span>
                <span class="tense-value" :class="{ special: currentWord.tenseForm.pastParticiple.special }">
                  {{ currentWord.tenseForm.pastParticiple.value }}
                  <span v-if="currentWord.tenseForm.pastParticiple.special" class="special-mark">★</span>
                </span>
              </div>
              <div class="tense-row">
                <span class="tense-label">现在分词</span>
                <span class="tense-value">{{ currentWord.tenseForm.presentParticiple }}</span>
              </div>
            </div>
          </div>
          
          <!-- 名词特殊模块 -->
          <div v-if="currentWord.mainPos.type === '名词(n.)'" class="module">
            <div class="module-header">
              <span class="module-icon">🐟</span>
              <h4>可数/不可数辨析</h4>
            </div>
            <div class="countable-info">
              <p>{{ currentWord.countableInfo }}</p>
            </div>
            
            <div class="module-header" style="margin-top: 10px;">
              <span class="module-icon">✏️</span>
              <h4>复数变化规则</h4>
            </div>
            <div class="plural-info">
              <span class="plural-value" :class="{ special: currentWord.plural.special }">
                {{ currentWord.plural.value }}
                <span v-if="currentWord.plural.special" class="special-mark">★</span>
              </span>
            </div>
          </div>
          
          <!-- 形容词/副词特殊模块 -->
          <div v-if="['形容词(adj.)', '副词(adv.)'].includes(currentWord.mainPos.type)" class="module">
            <div class="module-header">
              <span class="module-icon">📈</span>
              <h4>比较级&最高级</h4>
            </div>
            <div class="comparison-table">
              <div class="comparison-row">
                <span class="comparison-label">原级</span>
                <span class="comparison-value">{{ currentWord.comparison.base }}</span>
              </div>
              <div class="comparison-row">
                <span class="comparison-label">比较级</span>
                <span class="comparison-value" :class="{ special: currentWord.comparison.comparative.special }">
                  {{ currentWord.comparison.comparative.value }}
                  <span v-if="currentWord.comparison.comparative.special" class="special-mark">★</span>
                </span>
              </div>
              <div class="comparison-row">
                <span class="comparison-label">最高级</span>
                <span class="comparison-value" :class="{ special: currentWord.comparison.superlative.special }">
                  {{ currentWord.comparison.superlative.value }}
                  <span v-if="currentWord.comparison.superlative.special" class="special-mark">★</span>
                </span>
              </div>
            </div>
            
            <div class="module-header" style="margin-top: 10px;">
              <span class="module-icon">🔄</span>
              <h4>词性转换</h4>
            </div>
            <div class="conversion-info">
              <ul>
                <li v-for="(conversion, index) in currentWord.conversion" :key="index">
                  {{ conversion.type }}：{{ conversion.word }}
                </li>
              </ul>
            </div>
          </div>
          
          <!-- 经典句子 -->
          <div class="module">
            <div class="module-header">
              <span class="module-icon">✨</span>
              <h4>经典句子</h4>
            </div>
            <div class="sentences">
              <div v-for="(sentence, index) in currentWord.sentences" :key="index" class="sentence-item">
                <p class="sentence">{{ sentence.en }}</p>
                <p class="sentence-translation">{{ sentence.zh }}</p>
              </div>
            </div>
          </div>
          
          <!-- 特殊用法小贴士 -->
          <div class="module">
            <div class="module-header">
              <span class="module-icon">⚠️</span>
              <h4>特殊用法小贴士</h4>
            </div>
            <div class="tips">
              <p v-for="(tip, index) in currentWord.tips" :key="index">
                {{ index + 1 }}. {{ tip }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card-navigation">
      <button class="nav-btn" @click.stop="prevWord">上一个</button>
      <button class="nav-btn" @click.stop="nextWord">下一个</button>
    </div>
    
    <div class="instructions">
      <p>点击卡片翻页 | 左右按钮切换单词</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WordCard',
  data() {
    return {
      isFlipped: false,
      currentIndex: 0,
      selectedLevel: 'all',
      difficultyLevels: [
        { value: 'all', label: '全部' },
        { value: 1, label: '小学' },
        { value: 2, label: '初中' },
        { value: 3, label: '高中' }
      ],
      words: [
        {
          word: 'fly',
          phonetic: '/flaɪ/',
          posList: [
            { type: '🔴 动词(v.)', meaning: '飞；飞行；乘飞机', color: 'red' },
            { type: '🔵 名词(n.)', meaning: '苍蝇', color: 'blue' }
          ],
          mainPos: { type: '动词(v.)', color: 'red' },
          difficulty: 2,
          phrases: {
            junior: ['fly to the moon 飞向月球', 'fly a kite 放风筝', 'fly away 飞走'],
            senior: ['fly into a rage 勃然大怒', 'fly over 飞过']
          },
          tenseForm: {
            base: 'fly',
            past: { value: 'flew', special: true },
            pastParticiple: { value: 'flown', special: true },
            presentParticiple: 'flying'
          },
          sentences: [
            { en: 'Birds can fly high in the sky.', zh: '鸟儿能在天空中高飞。' },
            { en: 'I will fly to Beijing tomorrow.', zh: '我明天将飞往北京。' }
          ],
          tips: [
            'fly 作动词时，过去式和过去分词是特殊变化',
            'fly + 地点 表示「飞往某地」'
          ]
        },
        {
          word: 'fish',
          phonetic: '/fɪʃ/',
          posList: [
            { type: '🔵 名词(n.)', meaning: '鱼；鱼肉', color: 'blue' },
            { type: '🔴 动词(v.)', meaning: '钓鱼', color: 'red' }
          ],
          mainPos: { type: '名词(n.)', color: 'blue' },
          difficulty: 2,
          phrases: {
            junior: ['eat fish 吃鱼', 'go fishing 去钓鱼'],
            senior: ['a fish out of water 格格不入', 'fish for compliments 寻求赞美']
          },
          countableInfo: '1. 表「鱼肉」→ 不可数（例：I like fish.）\n2. 表「鱼的条数」→ 可数，单复数同形（例：two fish）\n3. 表「鱼的种类」→ 可数，复数为 fishes（例：many fishes）',
          plural: { value: 'fish（条数）/ fishes（种类）', special: true },
          sentences: [
            { en: 'My father caught two fish in the river yesterday.', zh: '我爸爸昨天在河里钓了两条鱼。' },
            { en: 'There are many different fishes in the sea.', zh: '海里有很多不同种类的鱼。' }
          ],
          tips: [
            '注意：不要把「鱼肉」写成 fishes！',
            'go fishing 是固定搭配，表示钓鱼活动'
          ]
        },
        {
          word: 'happy',
          phonetic: '/ˈhæpi/',
          posList: [
            { type: '🟢 形容词(adj.)', meaning: '快乐的；幸福的', color: 'green' }
          ],
          mainPos: { type: '形容词(adj.)', color: 'green' },
          difficulty: 1,
          phrases: {
            junior: ['be happy to do sth 乐意做某事', 'happy birthday 生日快乐'],
            senior: ['happy with sth 对某事满意', 'happy ending 圆满结局']
          },
          comparison: {
            base: 'happy',
            comparative: { value: 'happier', special: true },
            superlative: { value: 'happiest', special: true }
          },
          conversion: [
            { type: '副词', word: 'happily' },
            { type: '名词', word: 'happiness' }
          ],
          sentences: [
            { en: 'She is very happy to help others.', zh: '她很乐意帮助别人。' },
            { en: 'She is happier today than she was yesterday.', zh: '她今天比昨天开心。' }
          ],
          tips: [
            'happy 后接动词时，要用 to do 形式，不能直接接 doing！',
            '比较级变化规则：happy → happier（双写y变i加er）'
          ]
        },
        {
          word: 'go',
          phonetic: '/ɡoʊ/',
          posList: [
            { type: '🔴 动词(v.)', meaning: '去；走；进行', color: 'red' }
          ],
          mainPos: { type: '动词(v.)', color: 'red' },
          difficulty: 2,
          phrases: {
            junior: ['go to school 去上学', 'go home 回家', 'go shopping 去购物'],
            senior: ['go in for 爱好；参加', 'go through 经历；浏览']
          },
          tenseForm: {
            base: 'go',
            past: { value: 'went', special: true },
            pastParticiple: { value: 'gone', special: true },
            presentParticiple: 'going'
          },
          sentences: [
            { en: 'I usually go to the park on Sundays.', zh: '我通常周日去公园。' },
            { en: 'She has gone to Beijing, and she will be back next week.', zh: '她去了北京，下周回来。' }
          ],
          tips: [
            'go 的过去式和过去分词是特殊变化',
            '注意区分：have gone to（去了未回）vs have been to（去过已回）',
            'go + doing 表「从事某项活动」'
          ]
        },
        {
          word: 'run',
          phonetic: '/rʌn/',
          posList: [
            { type: '🔴 动词(v.)', meaning: '跑；奔跑；经营', color: 'red' }
          ],
          mainPos: { type: '动词(v.)', color: 'red' },
          difficulty: 2,
          phrases: {
            junior: ['run away 逃跑', 'run out of 用完'],
            senior: ['run a company 经营公司', 'run for office 竞选公职']
          },
          tenseForm: {
            base: 'run',
            past: { value: 'ran', special: true },
            pastParticiple: { value: 'run', special: true },
            presentParticiple: 'running'
          },
          sentences: [
            { en: 'The little boy likes to run in the park.', zh: '这个小男孩喜欢在公园里跑步。' },
            { en: 'We have run out of milk, so we need to buy some.', zh: '我们的牛奶喝完了，需要去买一些。' }
          ],
          tips: [
            'run 的现在分词要双写 n → running',
            '作「经营」讲时，是及物动词，后面直接加宾语'
          ]
        }
      ]
    }
  },
  computed: {
    currentWord() {
      return this.words[this.currentIndex]
    },
    difficultyText() {
      const level = this.currentWord.difficulty
      if (level === 1) return '小学核心词'
      if (level === 2) return '初中核心词'
      return '高中核心词'
    },
    filteredWords() {
      if (this.selectedLevel === 'all') {
        return this.words
      }
      return this.words.filter(word => word.difficulty === this.selectedLevel)
    }
  },
  methods: {
    flipCard() {
      this.isFlipped = !this.isFlipped
    },
    nextWord() {
      this.isFlipped = false
      this.currentIndex = (this.currentIndex + 1) % this.words.length
    },
    prevWord() {
      this.isFlipped = false
      this.currentIndex = (this.currentIndex - 1 + this.words.length) % this.words.length
    }
  }
}
</script>

<style scoped>
.word-card-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 15px;
}

.difficulty-filter {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.difficulty-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background-color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.difficulty-btn.active {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.card-wrapper {
  perspective: 1000px;
  margin: 20px 0;
  cursor: pointer;
}

.card {
  position: relative;
  width: 100%;
  height: 500px;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  border-radius: 20px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.card.flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 20px;
  padding: 30px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.front {
  background-color: #e3f2fd;
  align-items: center;
  justify-content: space-between;
}

.back {
  background-color: white;
  transform: rotateY(180deg);
  overflow-y: auto;
}

/* 正面样式 */
.word-header {
  text-align: center;
  margin-bottom: 20px;
}

.word {
  font-size: 48px;
  font-weight: bold;
  color: #333;
  margin: 0;
  font-family: 'Comic Sans MS', cursive, sans-serif;
}

.phonetic {
  font-size: 18px;
  color: #666;
  margin: 5px 0 0 0;
}

.part-of-speech {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  width: 100%;
  text-align: center;
}

.pos-tag {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 16px;
  display: inline-block;
}

.pos-tag.red {
  background-color: #ffebee;
  color: #c62828;
}

.pos-tag.blue {
  background-color: #e3f2fd;
  color: #1565c0;
}

.pos-tag.green {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.difficulty {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 20px;
}

.star {
  font-size: 20px;
  color: #ffc107;
}

.star.empty {
  color: #ddd;
}

.difficulty-text {
  margin-left: 10px;
  font-size: 14px;
  color: #666;
}

.image-placeholder {
  width: 120px;
  height: 120px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.image-icon {
  font-size: 36px;
}

/* 背面样式 */
.back-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #eee;
}

.back-header h3 {
  font-size: 24px;
  margin: 0;
  color: #333;
}

.part-of-speech-tag {
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
}

.module {
  margin-bottom: 25px;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.module-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.module-icon {
  font-size: 20px;
}

.module-header h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: bold;
}

.phrases {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.phrase-section h5 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #666;
  font-weight: bold;
}

.phrase-section ul {
  margin: 0;
  padding-left: 20px;
}

.phrase-section li {
  margin-bottom: 5px;
  font-size: 14px;
  color: #555;
}

/* 动词时态表 */
.tense-table {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tense-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.tense-row:last-child {
  border-bottom: none;
}

.tense-label {
  font-weight: bold;
  color: #666;
  font-size: 14px;
  width: 120px;
}

.tense-value {
  font-size: 14px;
  color: #333;
  font-weight: bold;
}

/* 名词相关样式 */
.countable-info, .plural-info {
  font-size: 14px;
  color: #555;
  line-height: 1.5;
}

.plural-value {
  font-weight: bold;
  color: #333;
}

/* 形容词相关样式 */
.comparison-table {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comparison-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.comparison-row:last-child {
  border-bottom: none;
}

.comparison-label {
  font-weight: bold;
  color: #666;
  font-size: 14px;
  width: 100px;
}

.comparison-value {
  font-size: 14px;
  color: #333;
  font-weight: bold;
}

.conversion-info ul {
  margin: 0;
  padding-left: 20px;
}

.conversion-info li {
  margin-bottom: 5px;
  font-size: 14px;
  color: #555;
}

/* 特殊变化标记 */
.special {
  color: #d32f2f;
}

.special-mark {
  color: #d32f2f;
  margin-left: 5px;
  font-weight: bold;
}

/* 句子样式 */
.sentences {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.sentence-item {
  background-color: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.sentence {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.sentence-translation {
  margin: 0;
  font-size: 13px;
  color: #666;
  font-style: italic;
}

/* 小贴士样式 */
.tips {
  font-size: 14px;
  color: #555;
  line-height: 1.6;
}

.tips p {
  margin: 0 0 10px 0;
}

.tips p:last-child {
  margin-bottom: 0;
}

/* 卡片导航 */
.card-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.nav-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  background-color: #409eff;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.3);
}

.nav-btn:hover {
  background-color: #66b1ff;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
}

/* 说明文字 */
.instructions {
  text-align: center;
  margin-top: 15px;
  color: #666;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .word-card-container {
    padding: 10px;
  }
  
  .card-face {
    padding: 20px;
  }
  
  .word {
    font-size: 36px;
  }
  
  .phonetic {
    font-size: 16px;
  }
  
  .nav-btn {
    padding: 10px 20px;
    font-size: 14px;
  }
}
</style>