import { connectDB, disconnectDB } from '../config/db.js';
import { Story } from '../models/Story.js';
import { Category } from '../models/Category.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80";

const STORIES_DATA = [
    {
        title: "GIVA raises over $100 million led by Multiples to take its store count past 1,000",
        summary: "The Bengaluru jewellery brand will use the funds to open stores, build up manufacturing and strengthen its leadership team.",
        content: `
      <p>Bengaluru-based jewellery brand GIVA has raised more than $100 million in a round led by Multiples Alternate Asset Management. Other investors also took part, but their names have not been disclosed.</p>
      <p>Ishendra Agarwal founded GIVA in 2019. The brand sells silver, gold and lab-grown diamond jewellery through more than 400 stores in India and Sri Lanka, as well as online.</p>
      <p>The company plans to use the new capital in three areas: opening more stores, strengthening its manufacturing, and expanding its leadership team. GIVA aims to run more than 1,000 stores within three to five years, which is more than double its current count.</p>
      <p>GIVA's revenue for FY26 is estimated at about ₹865 crore. The company has not yet filed its FY26 accounts, so the figure is unaudited.</p>
      <p>The round shows that investors are still backing consumer brands that pair online demand with a growing physical retail presence. Lab-grown diamonds and everyday silver jewellery have opened a price band below traditional fine jewellery, which suits first-time and younger buyers. More stores also give a brand more control over the customer's experience in person.</p>
      <p>The main test for GIVA will be keeping each new store profitable as it more than doubles its network in a crowded market.</p>
      <h3>Key facts</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr style="background:#f3f4f6;"><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Metric</th><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Details</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Company</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">GIVA (Bengaluru)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Amount</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Over $100 million</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Lead investor</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Multiples Alternate Asset Management</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Founder</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Ishendra Agarwal (2019)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Stores</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">400+ in India and Sri Lanka; target 1,000+ in 3–5 years</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>FY26 revenue</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">About ₹865 crore (unaudited)</td></tr>
        </tbody>
      </table>
    `,
        category: "funding",
        region: "Karnataka",
        city: "Bengaluru",
        tags: ["GIVA", "jewellery", "D2C", "retail", "Multiples", "Bengaluru"],
        sourceName: "StartupTalky",
        sourceUrl: "https://startuptalky.com",
        homepageSlot: "lead",
        isFeatured: true,
        isBreaking: false,
        fundingDetails: { amountUSD: "$100M+", round: "Undisclosed", investors: ["Multiples Alternate Asset Management"] }
    },
    {
        title: "EloElo raises $80 million Series C to take its microdrama app Story TV to the US",
        summary: "NBCUniversal and Hornbill Capital led the round in the Bengaluru company, which says Story TV has more than 40 million monthly users.",
        content: `
      <p>Bengaluru-based EloElo Group has raised $80 million in a Series C round co-led by Hornbill Capital and NBCUniversal. MIT Investment Management Company, Kalaari Capital, Play Ventures and Griffin Gaming Partners also invested.</p>
      <p>EloElo runs Story TV, an app for microdramas: short, episodic shows made for phone screens. The app has more than 5,000 of these dramas in six languages. The group also runs a learning app and an AI creative tool, Dolphin AI.</p>
      <p>The company says it has more than 40 million monthly active users. Founder Saurabh Pandey, who previously worked at Flipkart, started EloElo in 2020. He said more than 95% of this round is primary capital, meaning new money for the company rather than shares sold by existing investors. Mint reported the round values EloElo at about $500 million, citing an unnamed source.</p>
      <p>EloElo will spend the funds on original content and on taking Story TV abroad, starting with the United States. The company has now raised about $130 million in total.</p>
      <p>Microdramas are among the fastest-growing formats in mobile entertainment. They are cheap to produce, usually earn through pay-per-episode or subscriptions, and keep viewers coming back for each new episode. A global media company like NBCUniversal co-leading the round gives EloElo both capital and a partner that knows how to make and distribute content.</p>
      <p>Success in the US will depend on whether EloElo can create shows that work for American audiences while competing with apps that are already established there.</p>
      <h3>Key facts</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr style="background:#f3f4f6;"><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Metric</th><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Details</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Company</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">EloElo Group (Bengaluru)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Amount</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">$80 million, Series C</td></tr>
        </tbody>
      </table>
    `,
        category: "funding",
        region: "Karnataka",
        city: "Bengaluru",
        tags: ["EloElo", "Story TV", "microdrama", "media", "AI", "Bengaluru"],
        sourceName: "StartupTalky",
        sourceUrl: "https://startuptalky.com",
        homepageSlot: "top",
        isFeatured: false,
        isBreaking: false,
        fundingDetails: { amountUSD: "$80M", round: "Series C", investors: ["Hornbill Capital", "NBCUniversal"] }
    },
    {
        title: "Lenskart's Q2 profit more than doubles to ₹232 crore as overseas sales grow 36%",
        summary: "The eyewear retailer's revenue rose 36% to ₹2,845 crore, and EBITDA grew 50%.",
        content: `
      <p>Lenskart, the listed eyewear retailer from Delhi NCR, reported a net profit of ₹232 crore for the July-September quarter (Q2 FY27). That is more than double the ₹103 crore it earned in the same quarter last year.</p>
      <p>Revenue from operations rose 36% from a year earlier to ₹2,845 crore. Growth was even across markets. India revenue rose 35.5% to ₹1,668 crore, and international revenue rose 36.5% to ₹1,201 crore.</p>
      <p>EBITDA, a measure of operating profit, grew 50% to ₹622 crore. Because profit is rising faster than sales, a larger share of each rupee of revenue is now reaching the bottom line.</p>
      <p>The numbers matter beyond Lenskart. The company is one of a small group of consumer startups that have listed on Indian stock exchanges, and investors watch it to see whether a business that started online can stay profitable while running a large store network. Overseas markets now bring in more than 40% of revenue, so Lenskart depends less on Indian demand than most of its peers.</p>
      <p>The quarter also continues a strong year. Lenskart's net profit was about ₹228 crore in Q1, so it has earned more than ₹450 crore in the first half of FY27.</p>
      <p>The next question for investors is whether Lenskart can keep growing at this pace as it adds stores at home and abroad. The festive season, which falls in the second half of the year, will be the next test of demand.</p>
      <h3>Key facts (Q2 FY27)</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr style="background:#f3f4f6;"><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Metric</th><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Details</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Net profit</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹232 crore (vs ₹103 crore)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Revenue from operations</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹2,845 crore, up 36%</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>India revenue</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹1,668 crore, up 35.5%</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>International revenue</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹1,201 crore, up 36.5%</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>EBITDA</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹622 crore, up 50%</td></tr>
        </tbody>
      </table>
    `,
        category: "markets",
        region: "India",
        city: "Delhi NCR",
        tags: ["Lenskart", "eyewear", "results", "Q2 FY27", "listed startups", "Delhi NCR"],
        sourceName: "StartupTalky",
        sourceUrl: "https://startuptalky.com",
        homepageSlot: "top",
        isFeatured: false,
        isBreaking: false
    },
    {
        title: "MobiKwik posts its highest-ever quarterly profit, its fourth profitable quarter in a row",
        summary: "The Gurugram fintech earned ₹11.8 crore in Q2 after a ₹28.6 crore loss a year earlier, and payment volumes grew 35%.",
        content: `
      <p>MobiKwik, the Gurugram-based digital payments and lending company, reported a net profit of ₹11.8 crore for the July-September quarter (Q2 FY27). It is the highest quarterly profit in the company's history. In the same quarter last year, MobiKwik lost ₹28.6 crore.</p>
      <p>This is also MobiKwik's fourth profitable quarter in a row, showing the turnaround is holding up over time.</p>
      <p>Revenue from operations rose just over 9% to ₹295.7 crore. The platform grew faster than revenue: gross merchandise value (GMV), the total value of payments processed, rose 35% to ₹59,677 crore. Loan disbursals through the platform rose 34% to ₹1,082.6 crore.</p>
      <p>With GMV growing faster than revenue, MobiKwik is moving more money through its platform than before but earning less on each rupee. That is common in Indian payments, where UPI transactions for consumers earn little or nothing. So the profit is coming from tighter cost control and from lending, not just from payments.</p>
      <p>For listed Indian fintechs, steady profits now matter more than fast growth. Investors who sold off new-age stocks after their listings now want proof that these businesses can make money every quarter.</p>
      <p>The next thing to watch is whether MobiKwik's lending book keeps growing while bad loans stay under control, as unsecured consumer credit across India faces closer scrutiny.</p>
      <h3>Key facts (Q2 FY27)</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr style="background:#f3f4f6;"><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Metric</th><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Details</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Net profit</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹11.8 crore (vs ₹28.6 crore loss)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Revenue from operations</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹295.7 crore, up 9%+</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Platform GMV</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹59,677 crore, up 35%</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Loan disbursals</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹1,082.6 crore, up 34%</td></tr>
        </tbody>
      </table>
    `,
        category: "fintech",
        region: "India",
        city: "Delhi NCR",
        tags: ["MobiKwik", "fintech", "payments", "lending", "results", "Gurugram"],
        sourceName: "StartupTalky",
        sourceUrl: "https://startuptalky.com",
        homepageSlot: "none",
        isFeatured: false,
        isBreaking: false
    },
    {
        title: "Razorpay gets SEBI approval for a ₹5,000-6,000 crore IPO, reportedly eyeing a $5 billion valuation",
        summary: "The payments company filed its draft papers confidentially in June. Its listing would be one of the largest fintech IPOs in India.",
        content: `
      <p>Razorpay has received approval from market regulator SEBI for an initial public offering of ₹5,000-6,000 crore, according to people familiar with the matter. The payments company is reportedly aiming for a valuation of around $5 billion.</p>
      <p>Razorpay filed its draft IPO papers with SEBI in June through the confidential pre-filing route. This route lets a company submit its draft documents for review without making sensitive business details public straight away. It must still publish an updated draft before it opens the issue to investors. The split between new shares and shares sold by existing investors has not been disclosed.</p>
      <p>Harshil Mathur and Shashank Kumar founded Razorpay in 2014, and it became a unicorn in 2020. Its investors include Peak XV Partners, GIC, Tiger Global, Ribbit Capital, Lone Pine Capital, Alkeon Capital and TCV.</p>
      <p>In FY25, Razorpay's consolidated revenue from operations rose 65% to ₹3,783 crore, and gross profit rose 41% to ₹1,277 crore. The company posted a loss for the year after a one-time ESOP-related expense of ₹1,209 crore.</p>
      <p>The approval comes days after Razorpay received a final licence from the IFSCA, the regulator for GIFT City, to process cross-border payments into and out of India from GIFT City. Rival PhonePe paused its own IPO process in March 2026, which could leave Razorpay as the main fintech listing in the near term.</p>
      <h3>Key facts</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr style="background:#f3f4f6;"><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Metric</th><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Details</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Company</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Razorpay (Bengaluru)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Issue size</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹5,000–6,000 crore (reported)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Target valuation</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">About $5 billion (reported)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Filing route</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Confidential pre-filing, June 2026</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>FY25 revenue</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹3,783 crore, up 65%</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Founders</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Harshil Mathur, Shashank Kumar (2014)</td></tr>
        </tbody>
      </table>
    `,
        category: "markets",
        region: "India",
        tags: ["Razorpay", "IPO", "SEBI", "fintech", "payments"],
        sourceName: "Upstox, YourStory, StartupTalky",
        sourceUrl: "https://startuptalky.com",
        homepageSlot: "top",
        isFeatured: false,
        isBreaking: true
    },
    {
        title: "India is now ChatGPT's largest market, says OpenAI",
        summary: "Indian users have doubled since January. OpenAI is expanding ads in India to support its free and cheaper plans.",
        content: `
      <p>India has become ChatGPT's largest market by weekly active users, according to Prabhjeet Singh, OpenAI's managing director for India. He said the number of Indian users has doubled since January 2026.</p>
      <p>India passed 100 million weekly ChatGPT users in February, when OpenAI called it the company's second-largest market after the United States. Doubling since the start of the year has now taken India past the US.</p>
      <p>OpenAI is expanding advertising in India to help pay for its free and lower-priced plans. The company is also expected to announce UPI payment options and new pricing plans in the coming weeks. Paying through UPI would make subscriptions much easier for Indian users, many of whom do not use international credit cards.</p>
      <p>Singh, previously head of Uber in India, joined OpenAI as its first India managing director this year. The company has been building its local team and partnerships as usage in the country has surged.</p>
      <p>For Indian startups, the milestone cuts both ways. A huge base of users already comfortable with AI chatbots makes it easier to sell AI products to Indian consumers and businesses. But a free, widely used ChatGPT also raises the bar for any Indian AI startup that wants people to pay for a similar tool.</p>
      <p>The next signal to watch is how many free users OpenAI can convert into paying customers once UPI payments and cheaper plans arrive, and how Indian rivals price their products in response.</p>
      <h3>Key facts</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr style="background:#f3f4f6;"><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Metric</th><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Details</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Milestone</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">India is ChatGPT's largest market by weekly active users</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Growth</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Indian users doubled since January 2026</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Earlier mark</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">100 million+ weekly users in February 2026</td></tr>
        </tbody>
      </table>
    `,
        category: "ai",
        region: "India",
        tags: ["OpenAI", "ChatGPT", "India", "AI", "US"],
        sourceName: "SNR Desk",
        sourceUrl: "https://example.com",
        homepageSlot: "top",
        isFeatured: false,
        isBreaking: false
    },
    {
        title: "Affle to buy Israel's Perion for $420 million in an all-cash deal",
        summary: "The Indian adtech company will add retail media, connected TV and digital out-of-home advertising, and expects a $700 million revenue run rate by FY2028.",
        content: `
      <p>Affle 3i, the listed Indian adtech company, has signed a definitive agreement to acquire Israel-based Perion Network for about $420 million in cash. Affle will pay $11.70 per Perion share, a 34.5% premium to Perion's last closing price.</p>
      <p>Affle will make the purchase through its Israeli subsidiary, Affle 3iL. It will pay with bank financing and cash on hand. Perion will become a wholly owned subsidiary and keep its brand. The deal is expected to close in early 2027.</p>
      <p>Perion runs advertising for brands in developed markets across retail media, connected TV (CTV) and digital out-of-home (DOOH) screens. Its technology includes the Perion One platform and Outmax, an AI agent that manages and improves ad campaigns. Its search business suffered after Microsoft changed its partner terms in 2024. Perion had about $228 million in cash and no financial debt as of 30 September.</p>
      <p>Affle is known for mobile marketing on a cost-per-converted-user model, where advertisers pay only when a user takes an action. It plans to combine this with Perion's channels to offer new formats such as "CTV-to-Cart" and "DOOH-to-Cart", which link ads seen on a TV or public screen to a purchase.</p>
      <p>Affle expects the combined business to pass a $700 million annual revenue run rate in FY2028 and to add to earnings per share within a year of closing. Its shares rose about 9% on the day the deal was announced.</p>
      <h3>Key facts</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr style="background:#f3f4f6;"><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Metric</th><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Details</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Buyer</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Affle 3i (via Affle 3iL, Israel)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Target</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Perion Network (Israel)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Value</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">About $420 million, all cash</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Price</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">$11.70 per share, 34.5% premium</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Expected close</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Early 2027</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Combined target</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">$700M+ revenue run rate in FY2028</td></tr>
        </tbody>
      </table>
    `,
        category: "markets",
        region: "India",
        tags: ["Affle", "Perion", "adtech", "M&A", "connected TV", "retail media"],
        sourceName: "Angel One, StartupTalky",
        sourceUrl: "https://startuptalky.com",
        homepageSlot: "none",
        isFeatured: false,
        isBreaking: false
    },
    {
        title: "Nykaa's Q2 profit triples to ₹101 crore as revenue crosses ₹3,000 crore",
        summary: "Beauty brought in about 90% of revenue in the quarter, and fashion added ₹287 crore.",
        content: `
      <p>Nykaa, the beauty and fashion e-commerce company, reported a net profit of ₹101 crore for the July-September quarter (Q2 FY27). That is about three times the ₹33 crore it earned in the same quarter last year.</p>
      <p>Revenue from operations rose 28% to ₹3,006 crore, the first time Nykaa's quarterly revenue has crossed ₹3,000 crore. Beauty, its core business, brought in about ₹2,700 crore, or roughly 90% of the total. The fashion business contributed ₹287 crore.</p>
      <p>Nykaa's net profit for the first half of FY27 reached ₹181 crore.</p>
      <p>The result shows profit rising much faster than revenue. Nykaa now makes more on each sale than before, likely helped by its own brands, more advertising sold on its platform, and spending that is under tighter control. For a company that drew criticism for thin margins after it listed in 2021, a tripling of profit is a strong signal to the market.</p>
      <p>Beauty remains the main engine. India's beauty market is growing quickly as more shoppers outside the big cities buy premium and specialised products online, and Nykaa's mix of online and offline stores puts it in a strong position. Fashion is still a small share of the business and has been harder to turn profitable.</p>
      <p>The next quarter covers the main festive and wedding season, typically Nykaa's strongest period. Investors will watch whether fashion can start to contribute more to profit.</p>
      <h3>Key facts (Q2 FY27)</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr style="background:#f3f4f6;"><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Metric</th><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Details</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Net profit</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹101 crore (vs ₹33 crore)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Revenue from operations</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹3,006 crore, up 28%</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Beauty revenue</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">About ₹2,700 crore (~90%)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Fashion revenue</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹287 crore</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>H1 FY27 profit</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹181 crore</td></tr>
        </tbody>
      </table>
    `,
        category: "markets",
        region: "India",
        city: "Mumbai",
        tags: ["Nykaa", "beauty", "fashion", "ecommerce", "results", "Mumbai"],
        sourceName: "StartupTalky",
        sourceUrl: "https://startuptalky.com",
        homepageSlot: "none",
        isFeatured: false,
        isBreaking: false
    },
    {
        title: "UPI's daily payment value crosses ₹1 lakh crore for the first time",
        summary: "October brought a record 25.47 billion transactions worth ₹31.53 lakh crore, up 23% in volume from a year earlier.",
        content: `
      <p>India's Unified Payments Interface (UPI) set new records in October 2026. The system handled 25.47 billion transactions in the month, up 5.8% from September and 23% from October 2025.</p>
      <p>The value of those payments rose 7.4% from September to ₹31.53 lakh crore. For the first time, the average daily value passed ₹1 lakh crore, reaching ₹1,01,707 crore. Average daily transactions rose to 822 million, from 802 million in September.</p>
      <p>October's festive season pushed spending higher, as it does every year, but the steady rise from month to month shows UPI is still reaching new users and new kinds of payments. People now use it for everything from paying a tea stall to paying rent and buying gold.</p>
      <p>For startups, UPI's scale is both an opportunity and a challenge. Founders can build on a free, fast payment system that almost every smartphone user already has. But because consumer UPI payments earn little or no fee, payment apps have to make money elsewhere, through lending, merchant software, insurance or wealth products. That is why most fintechs in this space are building credit and financial services on top of payments.</p>
      <p>The numbers also matter to global companies entering India: OpenAI, for example, is expected to add UPI as a payment option for ChatGPT plans.</p>
      <p>The next question is whether daily value holds above ₹1 lakh crore once festive spending fades.</p>
      <h3>Key facts (October 2026)</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr style="background:#f3f4f6;"><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Metric</th><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Details</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Transactions</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">25.47 billion, up 23% year on year</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Value</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹31.53 lakh crore, up 7.4% month on month</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Avg daily value</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹1,01,707 crore (first time above ₹1 lakh crore)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Avg daily volume</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">822 million transactions</td></tr>
        </tbody>
      </table>
    `,
        category: "fintech",
        region: "India",
        tags: ["UPI", "NPCI", "fintech", "payments", "October 2026"],
        sourceName: "SNR Desk",
        sourceUrl: "https://example.com",
        homepageSlot: "none",
        isFeatured: false,
        isBreaking: false
    },
    {
        title: "Clinics On Cloud raises ₹120 crore Series A to take its Health ATMs to the UAE",
        summary: "The Pune healthtech startup, bootstrapped until now, raised from Dubai-based Model42 at a ₹600 crore valuation.",
        content: `
      <p>Pune-based Clinics On Cloud has raised ₹120 crore in a Series A round led by Model42, a healthcare investor based in Dubai. The round values the company at ₹600 crore. It is the startup's first outside funding: it had been bootstrapped since Abhay Agarwal and Manashrri Agarwal founded it in 2018.</p>
      <p>Clinics On Cloud makes health check kiosks it calls "Health ATMs". A person can step up to a kiosk and, in about 10 minutes, get readings for ECG, blood pressure, blood oxygen and haemoglobin. The company says it has more than 3,500 kiosks installed.</p>
      <p>The new money will fund international expansion, starting with the UAE and then moving into Africa, the United States and Southeast Asia. The company will also invest in AI tools, research and more manufacturing capacity.</p>
      <p>Kiosk-based screening fills a real gap in India, where many people live far from a diagnostic lab or a doctor and routine check-ups are often skipped. Placing kiosks in workplaces, pharmacies, housing societies and rural health centres can catch problems such as high blood pressure or anaemia earlier and at lower cost.</p>
      <p>Having a Gulf-based investor lead the round fits the company's plan to start its overseas push in the UAE, where demand for preventive health services is high.</p>
      <p>The key test will be whether Clinics On Cloud can win approvals and partners in each new country while keeping its kiosks affordable.</p>
      <h3>Key facts</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr style="background:#f3f4f6;"><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Metric</th><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Details</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Company</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Clinics On Cloud (Pune)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Amount</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹120 crore, Series A</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Valuation</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹600 crore</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Lead investor</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Model42 (Dubai)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Installations</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">3,500+ Health ATMs</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Founders</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Abhay Agarwal, Manashri Agarwal (2018)</td></tr>
        </tbody>
      </table>
    `,
        category: "funding",
        region: "India",
        city: "Pune",
        tags: ["Clinics On Cloud", "healthtech", "diagnostics", "Series A", "Pune"],
        sourceName: "StartupTalky",
        sourceUrl: "https://startuptalky.com",
        homepageSlot: "none",
        isFeatured: false,
        isBreaking: false,
        fundingDetails: { amountINR: "₹120 Cr", round: "Series A", investors: ["Model42"] }
    },
    {
        title: "Peppermint Robotics raises ₹100 crore to set up an assembly line in North America",
        summary: "The Pune maker of autonomous cleaning robots counts the US as its largest market and says revenue grew nearly six times in two years.",
        content: `
      <p>Pune-based Peppermint Robotics has raised ₹100 crore in a pre-Series B round led by pi Ventures and Crane Venture Partners. Asiana Fund also took part. The round includes both new shares and the sale of some existing shares.</p>
      <p>Founded in 2019, Peppermint builds self-driving robots that clean floors and move materials. Its machines run in factories, hospitals, airports and warehouses across nine countries. The United States is its largest market.</p>
      <p>The company will use the money to expand manufacturing and set up an assembly line in North America. It says its revenue grew nearly six times between FY24 and FY26.</p>
      <p>Building in North America brings Peppermint closer to its biggest customers. It can cut shipping time and costs, and make after-sales service easier. A local line also gives the company more room to work around tariffs and the supply-chain disruptions that have hit imported machines.</p>
      <p>The round shows how investor interest in Indian deeptech is shifting from software alone towards hardware and robotics that can compete globally. A company designed and engineered in India but selling mostly in the US is a model more hardware startups are trying to follow.</p>
      <p>The challenge ahead is running factories on two continents and keeping quality and margins steady as volumes grow.</p>
      <h3>Key facts</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr style="background:#f3f4f6;"><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Metric</th><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Details</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Company</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Peppermint Robotics (Pune)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Amount</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">₹100 crore, pre-Series B</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Lead investors</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">pi Ventures, Crane Venture Partners</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Other investor</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Asiana Fund</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Markets</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Nine countries; US is largest</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Growth</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Revenue up nearly 6x, FY24 to FY26 (company claim)</td></tr>
        </tbody>
      </table>
    `,
        category: "funding",
        region: "India",
        city: "Pune",
        tags: ["Peppermint Robotics", "robotics", "deeptech", "manufacturing", "Pune"],
        sourceName: "StartupTalky",
        sourceUrl: "https://startuptalky.com",
        homepageSlot: "none",
        isFeatured: false,
        isBreaking: false,
        fundingDetails: { amountINR: "₹100 Cr", round: "Pre-Series B", investors: ["pi Ventures", "Crane Venture Partners"] }
    },
    {
        title: "Two Point O Capital raises $10 million to help factories switch to clean energy",
        summary: "Transition VC led the round in the 2024 climate-finance startup, whose clients include Godrej, JK Tyre, Wipro and Phoenix Mills.",
        content: `
      <p>Two Point O Capital, a climate-finance startup founded in 2024, has raised $10 million in a funding round led by Transition VC. The company helps industrial clients switch to clean energy.</p>
      <p>Its client list includes major Indian corporates like Godrej, JK Tyre, Wipro, and Phoenix Mills. The funding will be used to scale its operations and expand its clean energy financing solutions across factories and industrial zones.</p>
      <p>The transition to clean energy is capital intensive. Platforms like Two Point O Capital bridge the gap by financing the upfront costs of solar installations, battery storage, and energy efficiency upgrades, allowing factories to switch without massive capital expenditure.</p>
      <h3>Key facts</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr style="background:#f3f4f6;"><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Metric</th><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Details</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Company</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Two Point O Capital</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Amount</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">$10 million</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Lead investor</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Transition VC</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Founded</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">2024</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Sector</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Climate tech, clean energy</td></tr>
        </tbody>
      </table>
    `,
        category: "funding",
        region: "India",
        tags: ["Two Point O Capital", "climate tech", "clean energy", "battery storage"],
        sourceName: "StartupTalky",
        sourceUrl: "https://startuptalky.com",
        homepageSlot: "none",
        isFeatured: false,
        isBreaking: false,
        fundingDetails: { amountUSD: "$10M", round: "Undisclosed", investors: ["Transition VC"] }
    },
    {
        title: "Fal raises $1.3 billion at a $16 billion valuation as demand for AI video infrastructure surges",
        summary: "Bessemer led the Series F in the San Francisco company, whose valuation doubled from $8 billion in April.",
        content: `
      <p>Fal, a San Francisco company that runs the infrastructure behind generative image, video and audio AI, has raised $1.3 billion in a Series F round. Bessemer Venture Partners led the round, with Nvidia, Sound Ventures, HOF Capital and T. Rowe Price participating. The deal values Fal at about $16 billion, double its $8 billion valuation in April.</p>
      <p>Fal announced the round on 3 November along with a $350 million Series E, led by Sequoia, that had closed earlier.</p>
      <p>The company was founded in 2021. It gives developers fast, ready-to-use access to generative media models, so an app can create images, video clips or voice without the app maker running its own GPU servers. Bloomberg reported that Fal has more than $800 million in annualised revenue, a figure the company has not audited. Demand ran so high this summer that Fal had to limit how much some customers could use its service.</p>
      <p>The round shows where AI money is moving: from building models towards the infrastructure needed to run them at scale. AI video in particular takes far more computing power than text, which makes fast, cheap model serving a valuable business.</p>
      <p>For Indian founders building AI video, advertising or creator tools, services like Fal lower the cost of starting out, but they also mean depending on a fast-growing US supplier for a core part of the product.</p>
      <h3>Key facts</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr style="background:#f3f4f6;"><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Metric</th><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Details</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Company</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Fal (San Francisco)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Amount</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">$1.3 billion, Series F</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Lead investor</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Bessemer Venture Partners</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Valuation</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">About $16 billion (from $8 billion in April)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Revenue</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">$800M+ annualised (reported, unaudited)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Founders</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Burkay Gur, Gorkem Yurtseven (2021)</td></tr>
        </tbody>
      </table>
    `,
        category: "ai",
        region: "Global",
        city: "San Francisco",
        tags: ["Fal", "generative AI", "AI infrastructure", "video AI", "Series F"],
        sourceName: "Tech Startups",
        sourceUrl: "https://techstartups.com",
        homepageSlot: "none",
        isFeatured: false,
        isBreaking: true
    },
    {
        title: "Traversal raises $120 million for AI agents that find and fix software outages",
        summary: "Kleiner Perkins, Redpoint and Khosla co-led the Series B, valuing the New York startup at about $1 billion.",
        content: `
      <p>Traversal, a New York startup building AI agents for site reliability engineering, has raised $120 million in a Series B round. Kleiner Perkins, Redpoint Ventures and Khosla Ventures co-led the round, with Sequoia, Battery Ventures and Amex Ventures also investing. The round values Traversal at about $1 billion, and the company has raised $173 million in total.</p>
      <p>Site reliability engineering is the work of keeping software systems running. When an app or website goes down, engineers have to dig through logs, metrics and recent code changes to find the cause, often late at night and under pressure. Traversal's AI agents do that investigation on their own: they find the likely cause of an outage and suggest or carry out the fix.</p>
      <p>Traversal's customers include Brazilian digital bank Nubank, legal AI company Harvey, cloud provider DigitalOcean and PepsiCo. The company says its annual recurring revenue has grown about nine times in 2026, a figure it has not audited.</p>
      <p>The round is part of a wider wave of funding for AI agents that take over specific, high-value jobs instead of acting as general chat assistants. Outages are expensive, so a tool that cuts the time to recovery has an easy return to show customers.</p>
      <p>The opportunity matters in India too, where large IT services firms and SaaS companies run on-call and support teams for global clients. Agents like Traversal's could change how that work is done.</p>
      <h3>Key facts</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr style="background:#f3f4f6;"><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Metric</th><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Details</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Company</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Traversal (New York)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Amount</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">$120 million, Series B</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Lead investors</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Kleiner Perkins, Redpoint Ventures, Khosla Ventures</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Valuation</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">About $1 billion</td></tr>
        </tbody>
      </table>
    `,
        category: "ai",
        region: "Global",
        city: "New York",
        tags: ["Traversal", "AI agents", "SRE", "DevOps", "enterprise software"],
        sourceName: "Tech Startups",
        sourceUrl: "https://techstartups.com",
        homepageSlot: "none",
        isFeatured: false,
        isBreaking: false
    },
    {
        title: "Kuaishou spinout Lingchuan raises RMB 1 billion for AI video chips",
        summary: "The Beijing chipmaker says it has sold nearly 100,000 of its SL200 chips to Kuaishou, Alibaba Cloud, Baidu Cloud and Bilibili.",
        content: `
      <p>Lingchuan Technology, a Beijing company that designs AI chips for video, has raised RMB 1 billion (about $140 million) in a Series B round. E-Town Capital's Yitang Shenghe Fund, Qiming Venture Partners and Zhaohui Capital co-led the round. The company did not disclose its valuation.</p>
      <p>Lingchuan began inside Kuaishou, one of China's largest short-video platforms, and became an independent company in March 2024. It builds specialised chips and software for processing video and for generative video.</p>
      <p>The company says it has sold nearly 100,000 of its SL200 chips. They are used by Kuaishou, Alibaba Cloud, Baidu Cloud and Bilibili. Lingchuan says its chips handle 99.7% of Kuaishou's live-stream transcoding, the process of converting video into the formats and quality levels different viewers need. It expects shipments of its next-generation chip to grow in 2027.</p>
      <p>The round reflects China's push to build its own AI chips as US export rules limit access to leading Nvidia hardware. Chips designed for one job, such as video, can be cheaper and more power-efficient than general-purpose GPUs for that work.</p>
      <p>For India, the story is a reminder of how far ahead platform companies can get when they design their own hardware. Indian video and streaming platforms still rely almost entirely on imported chips and cloud GPUs.</p>
      <p>The key question is whether Lingchuan can win customers beyond its parent company's circle as competition among Chinese chipmakers heats up.</p>
      <h3>Key facts</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr style="background:#f3f4f6;"><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Metric</th><th style="border:1px solid #e5e7eb; padding:8px; text-align:left;">Details</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Company</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Lingchuan Technology (Beijing)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Amount</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">RMB 1 billion (about $140 million), Series B</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Lead investors</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Yitang Shenghe Fund (E-Town Capital), Qiming Venture Partners, Zhaohui Capital</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Chips sold</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Nearly 100,000 SL200 (company claim)</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Customers</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Kuaishou, Alibaba Cloud, Baidu Cloud, Bilibili</td></tr>
          <tr><td style="border:1px solid #e5e7eb; padding:8px;"><strong>Origin</strong></td><td style="border:1px solid #e5e7eb; padding:8px;">Spun out of Kuaishou, independent since March 2024</td></tr>
        </tbody>
      </table>
    `,
        category: "ai",
        region: "Global",
        city: "Beijing",
        tags: ["Lingchuan", "AI chips", "semiconductors", "China", "video"],
        sourceName: "Tech Startups",
        sourceUrl: "https://techstartups.com",
        homepageSlot: "none",
        isFeatured: false,
        isBreaking: false
    }
];

async function seedLaunchNews() {
    await connectDB();
    logger.info('Starting Launch News Seed...');

    // 1. Fetch admin user to assign as creator
    const admin = await User.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });
    if (!admin) {
        logger.error('Admin user not found. Run the main seed script first.');
        process.exit(1);
    }

    // 2. Clear existing stories to start fresh (Optional - remove if you want to keep old ones)
    await Story.deleteMany({});
    logger.info('Cleared existing stories.');

    // 3. Insert the new stories
    let created = 0;
    const now = new Date();

    for (let i = 0; i < STORIES_DATA.length; i++) {
        const data = STORIES_DATA[i];

        // Offset publication times slightly so sorting works logically
        const publishedAt = new Date(now.getTime() - (i * 60 * 60 * 1000));

        const story = new Story({
            ...data,
            imageUrl: PLACEHOLDER_IMAGE,
            imageCredit: "Photo: Unsplash",
            status: "published",
            publishedAt,
            createdBy: admin._id,
        });

        await story.save();
        created++;
        logger.info(`Created story: ${story.title}`);
    }

    logger.info(`Successfully inserted ${created} stories.`);
    await disconnectDB();
}

seedLaunchNews().catch(async (err) => {
    logger.fatal({ err }, 'Seed failed');
    await disconnectDB().catch(() => undefined);
    process.exit(1);
});