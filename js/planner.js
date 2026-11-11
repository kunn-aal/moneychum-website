/* ==========================================================
   MONEYCHUM — MONEY PLANNER
   Shared profile key: moneychumProfile
   ========================================================== */

(() => {
    "use strict";

    const PROFILE_KEY = "moneychumProfile";

    const $ = (id) => document.getElementById(id);

    const money = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    });

    const formatMoney = (value) =>
        money.format(Number(value) || 0);


    // ======================================================
    // 1. LOCAL STORAGE
    // ======================================================

    function readProfile() {
        try {
            const saved = localStorage.getItem(PROFILE_KEY);
            return saved ? JSON.parse(saved) : null;

        } catch (error) {
            console.error("Could not read Moneychum profile:", error);
            return null;
        }
    }


    function saveProfile(profile) {
        try {
            localStorage.setItem(
                PROFILE_KEY,
                JSON.stringify(profile)
            );

            return true;

        } catch (error) {
            console.error("Could not save Moneychum profile:", error);
            return false;
        }
    }


    // Load previously saved financial information

    function loadSavedProfile() {

        const profile = readProfile();

        if (!profile) return;

        const savedValues = {

            totalMoney: profile.money?.total,

            monthlyIncome: profile.income?.monthly,

            currentSavings: profile.savings?.current,

            food: profile.expenses?.food,

            transport: profile.expenses?.transport,

            college: profile.expenses?.college,

            phone: profile.expenses?.phone,

            other: profile.expenses?.other,

            monthlySavings: profile.savings?.monthlyTarget,

            daysToManage: profile.daysToManage,

            goalName: profile.goal?.name,

            goalAmount: profile.goal?.target

        };


        Object.entries(savedValues).forEach(([id, value]) => {

            if ($(id) && value !== undefined && value !== null) {

                $(id).value = value;

            }

        });

    }


    // ======================================================
    // 2. FORM VALIDATION
    // ======================================================

    function readAmount(id, label, options = {}) {

        const raw = $(id).value.trim();

        const required = options.required !== false;

        const allowZero = options.allowZero !== false;


        if (raw === "") {

            if (required) {
                throw new Error(`Please enter ${label}.`);
            }

            return null;

        }


        const value = Number(raw);


        if (!Number.isFinite(value)) {

            throw new Error(`Enter a valid number for ${label}.`);

        }


        if (value < 0 || (!allowZero && value === 0)) {

            throw new Error(
                `${label} ${
                    allowZero
                        ? "cannot be negative"
                        : "must be greater than zero"
                }.`
            );

        }


        return value;

    }



    function collectProfile() {

        const totalMoney = readAmount(
            "totalMoney",
            "current total money"
        );


        const monthlyIncome = readAmount(
            "monthlyIncome",
            "monthly income"
        );


        const currentSavings = readAmount(
            "currentSavings",
            "current savings"
        );


        // Collect essential expenses

        const expenses = {

            food: readAmount("food", "food expenses"),

            transport: readAmount(
                "transport",
                "transport expenses"
            ),

            college: readAmount(
                "college",
                "college expenses"
            ),

            phone: readAmount(
                "phone",
                "phone / internet expenses"
            ),

            other: readAmount(
                "other",
                "other essential expenses"
            )

        };


        const monthlySavingsTarget = readAmount(
            "monthlySavings",
            "monthly savings target"
        );


        const daysToManage = readAmount(
            "daysToManage",
            "number of days",
            { allowZero: false }
        );


        if (!Number.isInteger(daysToManage)) {

            throw new Error(
                "The number of days must be a whole number."
            );

        }


        if (currentSavings > totalMoney) {

            throw new Error(
                "Current savings cannot be greater than current total money."
            );

        }


        // Savings goal is optional

        const goalName = $("goalName").value.trim();

        const goalAmountText = $("goalAmount").value.trim();


        let goal = {
            active: false,
            name: "",
            target: 0
        };


        if (goalName || goalAmountText) {

            if (!goalName || !goalAmountText) {

                throw new Error(
                    "For your optional savings goal, enter both the goal name and amount, or leave both blank."
                );

            }


            const target = Number(goalAmountText);


            if (!Number.isFinite(target) || target <= 0) {

                throw new Error(
                    "Your savings goal amount must be greater than zero."
                );

            }


            goal = {
                active: true,
                name: goalName,
                target: target
            };

        }


        // This structure is shared with the Dashboard

        return {

            money: {
                total: totalMoney
            },

            income: {
                monthly: monthlyIncome
            },

            expenses: expenses,

            savings: {

                current: currentSavings,

                monthlyTarget: monthlySavingsTarget

            },

            daysToManage: daysToManage,

            goal: goal

        };

    }



    // ======================================================
    // 3. FINANCIAL CALCULATIONS
    // ======================================================

    function calculate(profile) {


        // Calculate total essential expenses

        const essentialExpenses = Object.values(
            profile.expenses
        ).reduce(
            (total, amount) => total + amount,
            0
        );


        // Money available for spending

        const availableMoney =
            profile.money.total -
            profile.savings.current;


        // Monthly balance after essentials

        const monthlyBalance =
            profile.income.monthly -
            essentialExpenses;


        // Monthly balance after savings target

        const afterSavingsTarget =
            monthlyBalance -
            profile.savings.monthlyTarget;


        // Daily budget

        const dailyBudget =
            availableMoney /
            profile.daysToManage;


        // Savings goal calculations

        let goalRemaining = 0;

        let goalProgress = 0;

        let goalMonths = null;


        if (profile.goal.active) {

            goalRemaining = Math.max(
                0,
                profile.goal.target -
                profile.savings.current
            );


            goalProgress = Math.min(
                100,
                (
                    profile.savings.current /
                    profile.goal.target
                ) * 100
            );


            if (goalRemaining === 0) {

                goalMonths = 0;

            }

            else if (profile.savings.monthlyTarget > 0) {

                goalMonths = Math.ceil(
                    goalRemaining /
                    profile.savings.monthlyTarget
                );

            }

        }


        return {

            profile,

            essentialExpenses,

            availableMoney,

            monthlyBalance,

            afterSavingsTarget,

            dailyBudget,

            goalRemaining,

            goalProgress,

            goalMonths

        };

    }



    // ======================================================
    // 4. DISPLAY MESSAGES
    // ======================================================

    function showMessage(message, type = "error") {

        let box = $("plannerMessage");


        if (!box) {

            box = document.createElement("p");

            box.id = "plannerMessage";


            const actions = document.querySelector(".actions");


            actions.insertAdjacentElement(
                "afterend",
                box
            );

        }


        box.className = `planner-message planner-message-${type}`;

        box.textContent = message;

        box.hidden = false;

    }



    function clearMessage() {

        const box = $("plannerMessage");

        if (box) {

            box.hidden = true;

        }

    }



    // Prevent user-provided text from becoming HTML

    function escapeHTML(value) {

        return String(value).replace(
            /[&<>"']/g,

            (character) => ({

                "&": "&amp;",

                "<": "&lt;",

                ">": "&gt;",

                '"': "&quot;",

                "'": "&#39;"

            })[character]

        );

    }



    // ======================================================
    // 5. PERSONALIZED FINANCIAL ADVICE
    // ======================================================

    function makeAdvice(data) {

        const p = data.profile;

        const advice = [];


        // Check monthly balance

        if (data.monthlyBalance < 0) {

            advice.push(

                `Your essential monthly expenses are ${formatMoney(
                    Math.abs(data.monthlyBalance)
                )} higher than your income. Review the categories and consider which costs could realistically be reduced, replaced, or postponed.`

            );

        }

        else {

            advice.push(

                `After essential expenses, ${formatMoney(
                    data.monthlyBalance
                )} remains from your monthly income before your savings target.`

            );

        }



        // Check savings target

        if (data.afterSavingsTarget < 0) {

            advice.push(

                `Your savings target is ${formatMoney(
                    Math.abs(data.afterSavingsTarget)
                )} higher than the amount left after essentials. Consider setting a lower target that fits your current situation.`

            );

        }

        else if (p.savings.monthlyTarget > 0) {

            advice.push(

                `${formatMoney(
                    data.afterSavingsTarget
                )} remains each month after essential expenses and your planned savings target.`

            );

        }

        else {

            advice.push(

                "You have not set a monthly savings target. That's okay; you can focus on managing your current money and add a target later."

            );

        }



        // Check currently available money

        if (data.availableMoney > 0) {

            advice.push(

                `You have ${formatMoney(
                    data.availableMoney
                )} available outside your reserved savings. Across ${
                    p.daysToManage
                } days, that is about ${formatMoney(
                    data.dailyBudget
                )} per day. Treat this as a guide, not a strict rule.`

            );

        }

        else {

            advice.push(

                "You have no separate spending money outside the savings you reserved. Think about upcoming essentials before making a purchase."

            );

        }



        // Handle zero income

        if (
            p.income.monthly === 0 &&
            data.availableMoney > 0
        ) {

            advice.push(

                "Even with no monthly income entered, you do have current available money. This plan focuses on helping that amount last for the number of days you selected."

            );

        }

        else if (
            p.income.monthly === 0 &&
            data.availableMoney === 0
        ) {

            advice.push(

                "With no monthly income and no separate available spending money, focus on preserving funds and considering legitimate support or income options."

            );

        }



        // Savings goal advice

        if (p.goal.active) {

            if (data.goalRemaining === 0) {

                advice.push(

                    `Your current savings meet the amount entered for "${p.goal.name}".`

                );

            }

            else if (data.goalMonths !== null) {

                advice.push(

                    `"${p.goal.name}" has ${formatMoney(
                        data.goalRemaining
                    )} remaining. At your current monthly savings target, the estimate is about ${
                        data.goalMonths
                    } month${data.goalMonths === 1 ? "" : "s"}, assuming the target stays consistent.`

                );

            }

            else {

                advice.push(

                    `"${p.goal.name}" has ${formatMoney(
                        data.goalRemaining
                    )} remaining. Set a monthly savings target above zero to estimate how long it may take.`

                );

            }

        }

        else {

            advice.push(

                "No savings goal is set, so the planner will focus on day-to-day money management."

            );

        }


        return advice;

    }



    // ======================================================
    // 6. DISPLAY FINANCIAL RESULTS
    // ======================================================

    function renderResults(data) {

        const result = $("financialResult");

        const p = data.profile;


        const needsAttention =
            data.monthlyBalance < 0 ||
            data.afterSavingsTarget < 0;


        const bannerClass = needsAttention
            ? "result-status-warning"
            : "result-status-positive";


        const bannerTitle =
            data.monthlyBalance < 0
                ? "Your monthly plan needs attention"
                : data.afterSavingsTarget < 0
                    ? "Your savings target may need adjusting"
                    : "Your starting picture is ready";


        const bannerText =
            data.monthlyBalance < 0
                ? "Your essential monthly expenses are currently higher than your income. Review the breakdown below."
                : data.afterSavingsTarget < 0
                    ? "Your savings target is higher than the amount left after essentials. A smaller target may make the plan more manageable."
                    : "Here is a snapshot of your current money and monthly plan. Use it to guide your next decisions.";



        // Generate advice list

        const adviceHTML = makeAdvice(data)

            .map(
                (item) =>
                    `<li>${escapeHTML(item)}</li>`
            )

            .join("");



        // Savings goal section

        let goalHTML;


        if (p.goal.active) {

            const timeline =
                data.goalMonths === null
                    ? "Set a monthly savings target to estimate a timeline."
                    : data.goalMonths === 0
                        ? "Your recorded savings meet this goal amount."
                        : `Estimated timeline: about ${
                            data.goalMonths
                        } month${data.goalMonths === 1 ? "" : "s"}.`;


            goalHTML = `

                <p class="result-goal-name">
                    ${escapeHTML(p.goal.name)}
                </p>

                <p class="result-goal-amount">
                    ${formatMoney(p.savings.current)}
                    saved ·
                    ${formatMoney(p.goal.target)}
                    target
                </p>

                <div class="result-goal-track">

                    <span style="width:${data.goalProgress}%"></span>

                </div>

                <p class="result-goal-note">
                    ${formatMoney(data.goalRemaining)}
                    left to reach this goal.
                </p>

                <p class="result-goal-note">
                    ${escapeHTML(timeline)}
                </p>

            `;

        }

        else {

            goalHTML = `

                <p class="result-empty-goal">
                    No goal added. You can focus on managing your current money and add a goal later.
                </p>

            `;

        }



        // Monthly expense breakdown

        const expenseRows = [

            ["Monthly income", p.income.monthly],

            ["Essential expenses", data.essentialExpenses],

            ["Balance after essentials", data.monthlyBalance],

            ["Monthly savings target", p.savings.monthlyTarget],

            ["Left after savings target", data.afterSavingsTarget]

        ]


        .map(([label, value]) => `

            <div class="result-breakdown-row">

                <span>${label}</span>

                <strong class="${
                    value < 0 ? "negative-value" : ""
                }">

                    ${formatMoney(value)}

                </strong>

            </div>

        `)


        .join("");




        // Insert complete results into HTML

        result.innerHTML = `

            <div class="result-status ${bannerClass}">

                <strong>${bannerTitle}</strong>

                <p>${bannerText}</p>

            </div>



            <div class="result-metrics-grid">


                <article class="result-metric result-green">

                    <span>Available to spend now</span>

                    <strong>
                        ${formatMoney(data.availableMoney)}
                    </strong>

                    <small>
                        Total money minus reserved savings
                    </small>

                </article>



                <article class="result-metric result-blue">

                    <span>Essential monthly expenses</span>

                    <strong>
                        ${formatMoney(data.essentialExpenses)}
                    </strong>

                    <small>
                        Across the five categories
                    </small>

                </article>



                <article class="result-metric result-teal">

                    <span>Monthly balance</span>

                    <strong>
                        ${formatMoney(data.monthlyBalance)}
                    </strong>

                    <small>
                        Income minus essential expenses
                    </small>

                </article>



                <article class="result-metric result-purple">

                    <span>Daily spending guide</span>

                    <strong>
                        ${formatMoney(data.dailyBudget)}
                    </strong>

                    <small>
                        For ${p.daysToManage} days
                    </small>

                </article>


            </div>



            <div class="result-detail-grid">


                <article class="result-detail-card">

                    <h3>Monthly breakdown</h3>

                    ${expenseRows}

                </article>



                <article class="result-detail-card">

                    <h3>Savings goal</h3>

                    ${goalHTML}

                </article>


            </div>



            <article class="result-advice-card">

                <h3>What this means for you</h3>

                <ul>
                    ${adviceHTML}
                </ul>

            </article>



            <section class="purchase-checker">

                <p class="purchase-kicker">
                    BEFORE YOU BUY
                </p>

                <h3>
                    Can I afford this purchase?
                </h3>

                <p>
                    Try a purchase amount and see how it could affect your available money or reserved savings.
                </p>


                <div class="purchase-grid">


                    <label>
                        What are you planning to buy?

                        <input
                            id="purchaseName"
                            type="text"
                            maxlength="80"
                            placeholder="e.g. Headphones"
                        >

                    </label>



                    <label>
                        Purchase amount (₹)

                        <input
                            id="purchaseAmount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="e.g. 2500"
                        >

                    </label>



                    <label>
                        Pay using

                        <select id="purchaseSource">

                            <option value="available">
                                Available spending money
                            </option>

                            <option value="savings">
                                Reserved savings
                            </option>

                        </select>

                    </label>


                </div>



                <button
                    type="button"
                    id="checkPurchaseBtn"
                >
                    Check purchase impact
                </button>



                <div
                    id="purchaseResult"
                    aria-live="polite"
                ></div>


            </section>

        `;

    }



    // ======================================================
    // 7. PURCHASE AFFORDABILITY CHECKER
    // ======================================================

    function checkPurchase(data) {

        const name =
            $("purchaseName").value.trim() ||
            "This purchase";


        const amount = Number(
            $("purchaseAmount").value
        );


        const source = $("purchaseSource").value;

        const output = $("purchaseResult");


        output.replaceChildren();



        // Validate purchase amount

        if (!Number.isFinite(amount) || amount <= 0) {

            output.innerHTML = `

                <p class="purchase-warning">
                    Enter a purchase amount greater than zero.
                </p>

            `;

            $("purchaseAmount").focus();

            return;

        }



        const usingSavings = source === "savings";


        const availableFund = usingSavings
            ? data.profile.savings.current
            : data.availableMoney;


        const fundName = usingSavings
            ? "reserved savings"
            : "available spending money";


        const shortfall = amount - availableFund;



        // Purchase is not affordable

        if (shortfall > 0) {

            output.innerHTML = `

                <strong class="purchase-warning">

                    ${escapeHTML(name)}
                    is not affordable from ${fundName}.

                </strong>


                <p>

                    Purchase amount:
                    ${formatMoney(amount)}

                    · Available in this fund:
                    ${formatMoney(availableFund)}

                    · Short by:
                    ${formatMoney(shortfall)}.

                </p>


                <p class="purchase-tip">

                    Consider waiting, choosing a lower-cost option, or adjusting your plan. This check does not recommend borrowing.

                </p>

            `;

            return;

        }



        // Calculate purchase impact percentage

        const impact =
            availableFund > 0
                ? (amount / availableFund) * 100
                : 100;


        const impactLevel =
            impact <= 20
                ? "low"
                : impact <= 40
                    ? "moderate"
                    : "high";



        let details = `

            <strong class="impact-${impactLevel}">

                ${escapeHTML(name)}
                is within this fund, with ${impactLevel} impact.

            </strong>


            <p>

                This purchase uses
                ${impact.toFixed(1)}%
                of your ${fundName}.

            </p>

        `;



        // Purchase using available spending money

        if (!usingSavings) {


            const remaining =
                data.availableMoney - amount;


            details += `

                <p>

                    Available money after purchase:
                    ${formatMoney(remaining)}.

                    New daily guide for the next
                    ${data.profile.daysToManage}
                    days:

                    ${formatMoney(
                        remaining / data.profile.daysToManage
                    )}.

                </p>


                <p class="purchase-tip">

                    Your reserved savings stay unchanged in this scenario, so your savings goal timeline is not reduced by this purchase. Check that the remaining daily amount still works for your needs.

                </p>

            `;

        }



        // Purchase using reserved savings

        else {


            const newSavings =
                data.profile.savings.current - amount;


            details += `

                <p>

                    Reserved savings after purchase:
                    ${formatMoney(newSavings)}.

                </p>

            `;



            if (data.profile.goal.active) {


                const before = Math.max(
                    0,
                    data.profile.goal.target -
                    data.profile.savings.current
                );


                const after = Math.max(
                    0,
                    data.profile.goal.target -
                    newSavings
                );


                const target =
                    data.profile.savings.monthlyTarget;


                const monthsBefore =
                    before === 0
                        ? 0
                        : target > 0
                            ? Math.ceil(before / target)
                            : null;


                const monthsAfter =
                    after === 0
                        ? 0
                        : target > 0
                            ? Math.ceil(after / target)
                            : null;



                details += `

                    <p>

                        Goal amount remaining would change from
                        ${formatMoney(before)}
                        to
                        ${formatMoney(after)}.

                    </p>

                `;



                if (
                    monthsBefore !== null &&
                    monthsAfter !== null
                ) {


                    const delay =
                        monthsAfter - monthsBefore;


                    details += `

                        <p class="purchase-tip">

                            ${
                                delay > 0

                                    ? `This may delay "${escapeHTML(
                                        data.profile.goal.name
                                    )}" by approximately ${delay} month${
                                        delay === 1 ? "" : "s"
                                    }, assuming the monthly savings target stays the same.`

                                    : "This scenario does not increase the estimated time to reach your goal."

                            }

                        </p>

                    `;

                }

                else {

                    details += `

                        <p class="purchase-tip">

                            Using reserved savings reduces the amount set aside for your goal. Set a monthly savings target to estimate the effect on timing.

                        </p>

                    `;

                }

            }

            else {

                details += `

                    <p class="purchase-tip">

                        You have no savings goal set. This purchase still reduces your reserved money, so consider whether you need that buffer for upcoming needs.

                    </p>

                `;

            }

        }



        details += `

            <p class="purchase-disclaimer">

                This is a planning estimate, not a command. The decision remains yours.

            </p>

        `;


        output.innerHTML = details;

    }



    // ======================================================
    // 8. RESULT STYLING
    // ======================================================

    function addResultStyles() {

        if ($("plannerResultStyles")) return;


        const style = document.createElement("style");

        style.id = "plannerResultStyles";


        style.textContent = `

            .planner-message {
                margin: 10px 0 18px;
                padding: 12px 15px;
                border-radius: 9px;
                font-size: 13px;
            }

            .planner-message-error {
                color: #8f3028;
                background: #fff0ee;
                border: 1px solid #f1cbc5;
            }

            .planner-message-warning {
                color: #765813;
                background: #fff7e7;
                border: 1px solid #f0dfb7;
            }


            .result-status,
            .result-metric,
            .result-detail-card,
            .result-advice-card,
            .purchase-checker {
                padding: 16px 18px;
                border: 1px solid #e1ebe5;
                border-radius: 12px;
                background: #fff;
            }


            .result-status {
                margin-bottom: 15px;
            }

            .result-status p {
                margin: 5px 0 0;
                font-size: 12px;
            }

            .result-status-positive {
                color: #245b43;
                background: #eff8f2;
                border-color: #d5eadb;
            }

            .result-status-warning {
                color: #785a18;
                background: #fff7e9;
                border-color: #f0dfb9;
            }


            .result-metrics-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 11px;
                margin-bottom: 14px;
            }

            .result-metric {
                min-width: 0;
                border-top: 3px solid #16a36a;
            }

            .result-metric span,
            .result-metric strong,
            .result-metric small {
                display: block;
            }

            .result-metric span {
                color: #6c7d75;
                font-size: 11px;
                font-weight: 650;
            }

            .result-metric strong {
                margin: 6px 0 3px;
                font-size: clamp(16px, 2vw, 21px);
                overflow-wrap: anywhere;
            }

            .result-metric small {
                color: #84928b;
                font-size: 10px;
            }

            .result-blue {
                border-top-color: #5286bd;
            }

            .result-teal {
                border-top-color: #0f8b8d;
            }

            .result-purple {
                border-top-color: #8873bd;
            }


            .result-detail-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 13px;
                margin-bottom: 13px;
            }

            .result-detail-card h3,
            .result-advice-card h3,
            .purchase-checker h3 {
                margin: 0 0 12px;
                color: #2d5143;
                font-size: 15px;
            }


            .result-breakdown-row {
                display: flex;
                justify-content: space-between;
                gap: 10px;
                padding: 8px 0;
                border-bottom: 1px solid #edf2ef;
                font-size: 12px;
            }

            .result-breakdown-row:last-child {
                border: 0;
            }

            .result-breakdown-row strong {
                text-align: right;
            }

            .negative-value,
            .purchase-warning,
            .impact-high {
                color: #b34c3e;
            }


            .result-goal-name {
                margin: 0 0 5px;
                font-weight: 750;
            }

            .result-goal-amount,
            .result-goal-note,
            .result-empty-goal {
                color: #718179;
                font-size: 12px;
            }

            .result-goal-track {
                height: 9px;
                margin: 13px 0 8px;
                border-radius: 20px;
                overflow: hidden;
                background: #eeeaf7;
            }

            .result-goal-track span {
                display: block;
                height: 100%;
                border-radius: inherit;
                background: linear-gradient(
                    90deg,
                    #8d78ca,
                    #6d59a9
                );
            }

            .result-goal-note {
                margin: 5px 0 0;
            }


            .result-advice-card {
                margin-bottom: 13px;
                background: #f8fbf9;
            }

            .result-advice-card ul {
                margin: 0;
                padding-left: 19px;
                color: #53665d;
                font-size: 12px;
            }

            .result-advice-card li {
                margin: 8px 0;
                line-height: 1.5;
            }


            .purchase-checker {
                border-color: #d4e8dd;
                background: linear-gradient(
                    135deg,
                    #f5fbf7,
                    #fff
                );
            }

            .purchase-kicker {
                margin: 0 0 4px;
                color: #13875e;
                font-size: 10px;
                font-weight: 800;
                letter-spacing: 1px;
            }

            .purchase-checker > p:not(.purchase-kicker) {
                margin: -5px 0 14px;
                color: #728078;
                font-size: 12px;
            }


            .purchase-grid {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 12px;
            }

            .purchase-grid label {
                display: flex;
                flex-direction: column;
                gap: 6px;
                color: #344740;
                font-size: 12px;
                font-weight: 650;
            }

            .purchase-grid input,
            .purchase-grid select {
                width: 100%;
                min-height: 42px;
                padding: 9px 10px;
                border: 1px solid #cbd8d2;
                border-radius: 8px;
                background: #fff;
                color: #24332f;
                font: inherit;
                font-size: 13px;
            }


            #checkPurchaseBtn {
                margin-top: 13px;
                min-height: 40px;
                padding: 9px 15px;
                font-size: 12px;
            }

            #purchaseResult {
                margin-top: 12px;
                color: #53665d;
                font-size: 12px;
            }

            #purchaseResult:empty {
                display: none;
            }

            #purchaseResult p {
                margin: 6px 0;
                line-height: 1.5;
            }


            .purchase-tip {
                padding: 9px 11px;
                border-radius: 8px;
                background: #edf6f1;
                color: #47675a;
            }

            .purchase-disclaimer {
                color: #84928b;
                font-size: 10px;
            }

            .impact-low {
                color: #13875e;
            }

            .impact-moderate {
                color: #a77b19;
            }


            @media (max-width: 800px) {

                .result-metrics-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }

            }


            @media (max-width: 600px) {

                .result-detail-grid,
                .purchase-grid {
                    grid-template-columns: 1fr;
                }

            }

        `;


        document.head.appendChild(style);

    }



    // ======================================================
    // 9. ANALYZE FINANCES
    // ======================================================

    function analyzeFinances() {

        clearMessage();


        try {

            // Collect user information

            const profile = collectProfile();


            // Calculate financial status

            const data = calculate(profile);


            // Save data for Dashboard

            const saved = saveProfile(profile);


            // Display results

            renderResults(data);


            if (!saved) {

                showMessage(
                    "Your analysis is ready, but the browser could not save it. The Dashboard may not show the updated profile.",
                    "warning"
                );

            }


            // Scroll to results

            $("financialResult").scrollIntoView({

                behavior: "smooth",

                block: "start"

            });


        }

        catch (error) {

            showMessage(
                error.message ||
                "Please check your entries and try again."
            );

        }

    }



    // ======================================================
    // 10. INITIALIZE PLANNER
    // ======================================================

    function init() {

        const analyzeButton = $("analyzeBtn");

        const result = $("financialResult");


        if (!analyzeButton || !result) {

            console.error(
                "Moneychum Planner could not start. Check that planner.html contains #analyzeBtn and #financialResult."
            );

            return;

        }


        // Add styling for generated results

        addResultStyles();


        // Load saved information

        loadSavedProfile();


        // Analyze button event

        analyzeButton.addEventListener(
            "click",
            analyzeFinances
        );


        // Purchase checker event

        // Event delegation is used because the purchase
        // checker is created dynamically after analysis.

        result.addEventListener("click", (event) => {

            if (event.target.closest("#checkPurchaseBtn")) {

                const profile = readProfile();

                if (profile) {

                    checkPurchase(calculate(profile));

                }

            }

        });


        // Listen for changes from another Moneychum tab

        window.addEventListener("storage", (event) => {

            if (event.key === PROFILE_KEY) {

                loadSavedProfile();

            }

        });

    }



    // ======================================================
    // 11. START THE APPLICATION
    // ======================================================

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    }

    else {

        init();

    }

})();