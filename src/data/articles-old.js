// 示例文章数据
export const articles = [
    {
        id: 1,
        title_cn: "我的家",
        title_en: "My Family",
        level: "初级",
        characters: 180,
        estimated_time: "2分钟",
        content: `我叫小明。我的家有四口人：爸爸、妈妈、姐姐和我。

爸爸是医生，他每天都很忙。妈妈是老师，她教小学生。姐姐在大学学习英语，她很聪明。

我们的家不大，但是很温暖。周末的时候，我们一起做饭、看电影、聊天。

我爱我的家人。`,
        vocabulary: [
            { word: "家", pinyin: "jiā", en: "home, family", cn: "住的地方；家人" },
            { word: "医生", pinyin: "yī shēng", en: "doctor", cn: "看病的人" },
            { word: "老师", pinyin: "lǎo shī", en: "teacher", cn: "教学生的人" },
            { word: "大学", pinyin: "dà xué", en: "university", cn: "高等学校" },
            { word: "聪明", pinyin: "cōng míng", en: "clever, smart", cn: "脑子好，学东西快" },
            { word: "温暖", pinyin: "wēn nuǎn", en: "warm", cn: "不冷也不热，让人感觉舒服" },
            { word: "周末", pinyin: "zhōu mò", en: "weekend", cn: "星期六和星期天" }
        ]
    },
    {
        id: 2,
        title_cn: "一天的开始",
        title_en: "The Start of a Day",
        level: "初级",
        characters: 220,
        estimated_time: "2分钟",
        content: `每天早上六点半，我的闹钟响了。我慢慢地睁开眼睛，开始新的一天。

首先，我去洗手间洗脸、刷牙。然后，我换好衣服，去厨房吃早饭。妈妈做的早饭很好吃，有鸡蛋、牛奶和面包。

七点半，我背上书包去上学。学校离我家不远，走路大概十五分钟。

我喜欢早上的空气，很新鲜。路上有很多学生和我一起走，我们一边走一边聊天。`,
        vocabulary: [
            { word: "闹钟", pinyin: "nào zhōng", en: "alarm clock", cn: "定时响的钟，叫人起床" },
            { word: "慢慢地", pinyin: "màn màn de", en: "slowly", cn: "速度不快" },
            { word: "洗手间", pinyin: "xǐ shǒu jiān", en: "bathroom", cn: "洗手和上厕所的地方" },
            { word: "厨房", pinyin: "chú fáng", en: "kitchen", cn: "做饭的地方" },
            { word: "书包", pinyin: "shū bāo", en: "schoolbag", cn: "装书的包" },
            { word: "大概", pinyin: "dà gài", en: "approximately", cn: "差不多，不太准确" },
            { word: "新鲜", pinyin: "xīn xiān", en: "fresh", cn: "很新，没有变坏" }
        ]
    },
    {
        id: 3,
        title_cn: "四季的变化",
        title_en: "The Changes of Four Seasons",
        level: "中级",
        characters: 380,
        estimated_time: "4分钟",
        content: `中国有四个季节：春天、夏天、秋天和冬天。每个季节都有自己的特点和美丽。

春天是万物复苏的季节。天气变暖，花儿开放，树木长出新的叶子。人们喜欢在春天去公园散步，欣赏美丽的景色。

夏天是最热的季节。太阳很强烈，气温很高。很多人去游泳池或者海边玩水。夏天的水果特别多，西瓜、葡萄、桃子都很甜。

秋天是收获的季节。天气凉爽，树叶变成金黄色和红色。农民们忙着收割庄稼，准备过冬。中秋节也在秋天，这是中国重要的传统节日。

冬天是最冷的季节。北方会下雪，到处都是白色的。孩子们喜欢堆雪人、打雪仗。冬天最重要的节日是春节，全家人团聚在一起，吃团圆饭。

我最喜欢秋天，因为天气不冷不热，正好舒服。`,
        vocabulary: [
            { word: "季节", pinyin: "jì jié", en: "season", cn: "一年中的某个时期" },
            { word: "万物复苏", pinyin: "wàn wù fù sū", en: "everything comes back to life", cn: "所有东西都重新活过来" },
            { word: "欣赏", pinyin: "xīn shǎng", en: "appreciate, enjoy", cn: "看美好的东西感到高兴" },
            { word: "强烈", pinyin: "qiáng liè", en: "intense, strong", cn: "很强，很厉害" },
            { word: "收获", pinyin: "shōu huò", en: "harvest", cn: "收集农作物" },
            { word: "凉爽", pinyin: "liáng shuǎng", en: "cool and refreshing", cn: "不热，让人感觉舒服" },
            { word: "传统", pinyin: "chuán tǒng", en: "traditional", cn: "从过去流传下来的" },
            { word: "团聚", pinyin: "tuán jù", en: "reunion", cn: "分开的人聚在一起" }
        ]
    },
    {
        id: 4,
        title_cn: "人工智能与未来",
        title_en: "Artificial Intelligence and the Future",
        level: "高级",
        characters: 520,
        estimated_time: "6分钟",
        content: `人工智能（AI）是当今世界最热门的技术之一。它正在改变我们的生活方式，影响着各行各业。

人工智能的核心是让计算机模拟人类的思维能力。通过机器学习和深度学习，计算机可以从大量数据中学习规律，做出判断和决策。例如，人脸识别技术可以帮助我们解锁手机，语音助手可以回答我们的问题。

在医疗领域，人工智能可以辅助医生诊断疾病。它能够分析X光片和CT扫描图像，发现人眼难以察觉的细微变化。这大大提高了诊断的准确性和效率。

在教育领域，人工智能可以实现个性化学习。学习软件可以根据每个学生的水平和进度，自动调整教学内容和难度。这让每个学生都能以最适合自己的方式学习。

然而，人工智能也带来了一些挑战。有人担心机器会取代人类的工作，导致失业问题。还有人担心隐私和安全问题，因为人工智能需要收集和处理大量个人数据。

面对这些挑战，我们需要制定合理的政策和规范，确保人工智能的发展能够造福人类社会。同时，我们也要不断学习新知识，提升自己的能力，与人工智能和谐共存。

未来已来，我们准备好了吗？`,
        vocabulary: [
            { word: "人工智能", pinyin: "rén gōng zhì néng", en: "artificial intelligence", cn: "让机器像人一样思考的技术" },
            { word: "模拟", pinyin: "mó nǐ", en: "simulate, imitate", cn: "学着做得像某样东西" },
            { word: "机器学习", pinyin: "jī qì xué xí", en: "machine learning", cn: "让计算机从数据中学习的技术" },
            { word: "判断", pinyin: "pàn duàn", en: "judgment, decision", cn: "根据情况做出决定" },
            { word: "辅助", pinyin: "fǔ zhù", en: "assist, help", cn: "帮助，协助" },
            { word: "诊断", pinyin: "zhěn duàn", en: "diagnose", cn: "医生判断是什么病" },
            { word: "察觉", pinyin: "chá jué", en: "detect, perceive", cn: "发现，注意到" },
            { word: "个性化", pinyin: "gè xìng huà", en: "personalized", cn: "根据个人特点定制的" },
            { word: "取代", pinyin: "qǔ dài", en: "replace", cn: "用别的东西代替" },
            { word: "隐私", pinyin: "yǐn sī", en: "privacy", cn: "不想让别人知道的个人信息" },
            { word: "规范", pinyin: "guī fàn", en: "standard, regulation", cn: "大家应该遵守的规则" },
            { word: "造福", pinyin: "zào fú", en: "benefit, bring happiness", cn: "给别人带来好处" }
        ]
    },
    {
        id: 5,
        title_cn: "我的爱好",
        title_en: "My Hobbies",
        level: "初级",
        characters: 200,
        estimated_time: "2分钟",
        content: `每个人都有自己的爱好。我的爱好是画画和听音乐。

我从小就喜欢画画。小时候，我用蜡笔画太阳、花朵和小动物。现在，我学会了用水彩画风景。每个周末，我都会画一幅画。

听音乐让我感到放松。我喜欢听流行音乐，也喜欢古典音乐。做作业的时候，我常常一边听音乐一边写字。

爸爸说，爱好可以让生活更有趣。我同意他的话。画画和音乐让我每天都很开心。`,
        vocabulary: [
            { word: "爱好", pinyin: "ài hào", en: "hobby, interest", cn: "喜欢做的事情" },
            { word: "蜡笔", pinyin: "là bǐ", en: "crayon", cn: "用蜡做的彩色笔" },
            { word: "水彩", pinyin: "shuǐ cǎi", en: "watercolor", cn: "用水调的颜料" },
            { word: "风景", pinyin: "fēng jǐng", en: "scenery, landscape", cn: "自然的美丽景象" },
            { word: "放松", pinyin: "fàng sōng", en: "relax", cn: "不紧张，很舒服" },
            { word: "流行", pinyin: "liú xíng", en: "popular", cn: "很多人喜欢的" },
            { word: "古典", pinyin: "gǔ diǎn", en: "classical", cn: "传统的，很久以前的" }
        ]
    }
];

// 获取所有文章
export const getAllArticles = () => articles;

// 根据ID获取文章
export const getArticleById = (id) => articles.find(article => article.id === parseInt(id));

// 根据等级筛选文章
export const getArticlesByLevel = (level) => {
    if (!level || level === '全部') return articles;
    return articles.filter(article => article.level === level);
};

// 搜索文章
export const searchArticles = (query) => {
    if (!query) return articles;
    const lowerQuery = query.toLowerCase();
    return articles.filter(article =>
        article.title_cn.toLowerCase().includes(lowerQuery) ||
        article.title_en.toLowerCase().includes(lowerQuery)
    );
};

// 获取等级列表
export const getLevels = () => ['全部', '初级', '中级', '高级'];
