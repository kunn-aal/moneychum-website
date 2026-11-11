/* =====================================================
   MONEYCHUM — DASHBOARD JAVASCRIPT

   Shared profile: moneychumProfile
   Expense records: moneychumExpenses

   Works with the profile created by planner.js.
   ===================================================== */

(() => {
    "use strict";

    const PROFILE_KEY = "moneychumProfile";
    const EXPENSES_KEY = "moneychumExpenses";

    const $ = (id) => document.getElementById(id);

    const currency = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    });

    function formatMoney(value) {
        const number = Number(value);
        return currency.format(Number.isFinite(number) ? number : 0);
    }


    // =====================================================
    // 1. LOCAL STORAGE
    // =====================================================

    function readProfile() {
        try {
            const raw = localStorage.getItem(PROFILE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.error("Error reading financial profile:", error);
            return null;
        }
    }


    function readExpenses() {
        try {
            const raw = JSON.parse(
                localStorage.getItem(EXPENSES_KEY) || "[]"
            );

            if (!Array.isArray(raw)) return [];

            return raw.filter(expense =>
                expense &&
                typeof expense === "object" &&
                Number.isFinite(Number(expense.amount)) &&
                Number(expense.amount) > 0 &&
                expense.date &&
                !Number.isNaN(new Date(expense.date).getTime())
            );

        } catch (error) {
            console.error("Error reading expenses:", error);
            return [];
        }
    }


    function saveExpenses(expenses) {
        try {
            localStorage.setItem(
                EXPENSES_KEY,
                JSON.stringify(expenses)
            );

            return true;

        } catch (error) {
            console.error("Error saving expenses:", error);
            showMessage("Could not save expense. Check browser storage.", true);
            return false;
        }
    }


    // =====================================================
    // 2. READ THE MONEY PLANNER PROFILE
    // =====================================================

    function getProfileNumbers(profile) {

        if (!profile || typeof profile !== "object") {
            return null;
        }

        const totalMoney = Number(profile.money?.total);

        const currentSavings = Number(profile.savings?.current);

        const monthlyIncome = Number(profile.income?.monthly);

        const monthlySavingsTarget =
            Number(profile.savings?.monthlyTarget);

        const daysToManage = Number(profile.daysToManage);

        const expenses = profile.expenses || {};

        const categories = [
            "food",
            "transport",
            "college",
            "phone",
            "other"
        ];

        const expenseValues = categories.map(category =>
            Number(expenses[category])
        );

        const numbers = [
            totalMoney,
            currentSavings,
            monthlyIncome,
            monthlySavingsTarget,
            daysToManage,
            ...expenseValues
        ];

        if (!numbers.every(Number.isFinite)) {
            return null;
        }

        if (numbers.some(value => value < 0)) {
            return null;
        }

        if (daysToManage <= 0) {
            return null;
        }

        const essentialExpenses = expenseValues.reduce(
            (sum, value) => sum + value,
            0
        );

        const monthlyBalance =
            monthlyIncome - essentialExpenses;

        const afterSavingsTarget =
            monthlyBalance - monthlySavingsTarget;

        const availableBeforeTrackedSpending =
            totalMoney - currentSavings;


        // Savings goal calculations

        const goal = profile.goal || {};

        const goalTarget = Number(goal.target) || 0;

        const goalActive = Boolean(
            goal.active && goalTarget > 0
        );

        const goalName = goal.name || "Savings goal";

        const goalRemaining = goalActive
            ? Math.max(0, goalTarget - currentSavings)
            : 0;

        const goalProgress = goalActive
            ? Math.min(100, (currentSavings / goalTarget) * 100)
            : 0;

        const goalMonths = !goalActive
            ? null
            : goalRemaining === 0
                ? 0
                : monthlySavingsTarget > 0
                    ? Math.ceil(
                        goalRemaining / monthlySavingsTarget
                    )
                    : null;


        return {
            totalMoney,
            currentSavings,
            monthlyIncome,
            monthlySavingsTarget,
            daysToManage,
            essentialExpenses,
            monthlyBalance,
            afterSavingsTarget,
            availableBeforeTrackedSpending,
            goalActive,
            goalName,
            goalTarget,
            goalRemaining,
            goalProgress,
            goalMonths
        };
    }


    // =====================================================
    // 3. EXPENSE DATE AND CATEGORY CALCULATIONS
    // =====================================================

    function isCurrentMonth(dateValue) {

        const date = new Date(dateValue);

        const now = new Date();

        return (
            !Number.isNaN(date.getTime()) &&
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth()
        );
    }


    function getCurrentMonthExpenses(expenses) {

        return expenses.filter(expense =>
            isCurrentMonth(expense.date)
        );

    }


    function getCategoryTotals(expenses) {

        const totals = {
            food: 0,
            transport: 0,
            shopping: 0,
            entertainment: 0,
            other: 0
        };

        expenses.forEach(expense => {

            const category =
                Object.prototype.hasOwnProperty.call(
                    totals,
                    expense.category
                )
                    ? expense.category
                    : "other";

            totals[category] += Number(expense.amount);

        });

        return totals;
    }


    function getExpenseTotal(expenses) {

        return expenses.reduce(
            (sum, expense) => sum + Number(expense.amount),
            0
        );

    }


    // =====================================================
    // 4. SUMMARY CARDS AND DAILY GUIDANCE
    // =====================================================

    function renderSummary(profile, monthExpenses) {

        const monthTotal = getExpenseTotal(monthExpenses);

        $("monthlySpentValue").textContent =
            formatMoney(monthTotal);

        $("monthlySpentNote").textContent =
            `${monthExpenses.length} expense${monthExpenses.length === 1 ? "" : "s"} logged this month`;


        // No financial profile yet

        if (!profile) {

            $("availableMoneyValue").textContent = "—";

            $("availableMoneyNote").textContent =
                "Add your details in Money Planner";

            $("dailyBudgetValue").textContent = "—";

            $("dailyBudgetNote").textContent =
                "Based on your Money Planner details";

            $("goalStatusValue").textContent = "—";

            $("goalStatusNote").textContent =
                "Set a goal in Money Planner";

            $("dailyGuidanceAmount").textContent = "—";

            $("remainingMoneyValue").textContent = "—";

            $("dailyGuidanceText").textContent =
                "Add your financial details in Money Planner to get a daily spending guide.";

            return;
        }


        // Calculate remaining available money

        const remaining =
            profile.availableBeforeTrackedSpending - monthTotal;


        // Recalculate daily guide after tracked spending

        const dailyGuide =
            remaining / profile.daysToManage;


        // Available money card

        $("availableMoneyValue").textContent =
            formatMoney(remaining);

        $("availableMoneyNote").textContent =
            `After reserved savings and ${formatMoney(monthTotal)} tracked spending`;


        // Daily budget card

        $("dailyBudgetValue").textContent =
            formatMoney(dailyGuide);

        $("dailyBudgetNote").textContent =
            `Updated across ${profile.daysToManage} days`;


        // Guidance panel

        $("dailyGuidanceAmount").textContent =
            formatMoney(dailyGuide);

        $("remainingMoneyValue").textContent =
            formatMoney(remaining);


        if (remaining < 0) {

            $("dailyGuidanceText").textContent =
                `Your tracked expenses are ${formatMoney(Math.abs(remaining))} above the amount available outside reserved savings. Review your records and financial plan.`;

        }

        else if (
            profile.monthlyIncome === 0 &&
            remaining > 0
        ) {

            $("dailyGuidanceText").textContent =
                `You have no monthly income entered, but ${formatMoney(remaining)} remains outside reserved savings. Use your daily guide to manage the money you already have.`;

        }

        else {

            $("dailyGuidanceText").textContent =
                `You have ${formatMoney(remaining)} left outside reserved savings. Your updated daily guide accounts for the expenses you have tracked. Treat it as a guide, not a strict rule.`;

        }


        // Goal summary card

        if (profile.goalActive) {

            $("goalStatusValue").textContent =
                `${Math.round(profile.goalProgress)}%`;

            $("goalStatusNote").textContent =
                `${profile.goalName} · ${formatMoney(profile.goalTarget)}`;

        } else {

            $("goalStatusValue").textContent = "Not set";

            $("goalStatusNote").textContent =
                "Add an optional goal in Money Planner";

        }

    }


    // =====================================================
    // 5. SPENDING SNAPSHOT
    // =====================================================

    function renderSpending(monthExpenses) {

        const totals = getCategoryTotals(monthExpenses);

        const overall = Object.values(totals).reduce(
            (sum, amount) => sum + amount,
            0
        );

        const rows = [
            ["food", "spendFood", "barFood"],
            ["transport", "spendTransport", "barTransport"],
            ["shopping", "spendShopping", "barShopping"],
            ["entertainment", "spendEntertainment", "barEntertainment"],
            ["other", "spendOther", "barOther"]
        ];


        rows.forEach(([category, valueId, barId]) => {

            $(valueId).textContent =
                formatMoney(totals[category]);

            const percentage = overall > 0
                ? (totals[category] / overall) * 100
                : 0;

            $(barId).style.width = `${percentage}%`;

        });


        $("spendingChartNote").textContent = overall > 0
            ? `Tracked spending this month: ${formatMoney(overall)}. Bars show each category's share.`
            : "Add an expense below to start building your spending snapshot.";

    }


    // =====================================================
    // 6. SAVINGS GOAL
    // =====================================================

    function renderGoal(profile) {

        if (!profile || !profile.goalActive) {

            $("goalName").textContent =
                "No goal added yet";

            $("goalSavedLabel").textContent =
                "Set a goal in Money Planner";

            $("goalPercent").textContent = "—";

            $("goalFill").style.width = "0%";

            $("goalRemaining").textContent =
                "Your progress will appear here when you add an optional savings goal.";

            return;

        }


        $("goalName").textContent =
            profile.goalName;

        $("goalSavedLabel").textContent =
            `${formatMoney(profile.currentSavings)} saved toward ${formatMoney(profile.goalTarget)}`;

        $("goalPercent").textContent =
            `${Math.round(profile.goalProgress)}%`;

        $("goalFill").style.width =
            `${profile.goalProgress}%`;


        if (profile.goalRemaining === 0) {

            $("goalRemaining").textContent =
                "Your recorded savings meet the amount entered for this goal.";

        }

        else if (profile.goalMonths === null) {

            $("goalRemaining").textContent =
                `${formatMoney(profile.goalRemaining)} left. Set a monthly savings target to estimate a timeline.`;

        }

        else {

            $("goalRemaining").textContent =
                `${formatMoney(profile.goalRemaining)} left. Estimated time: about ${profile.goalMonths} months.`;

        }

    }


    // =====================================================
    // 7. FINANCIAL OBSERVATIONS
    // =====================================================

    function renderAlerts(profile, monthExpenses, monthTotal) {

        const alerts = [];


        if (!profile) {

            alerts.push([
                "info",
                "Your Dashboard is ready. Add your financial details in Money Planner to see personalized observations."
            ]);

        }

        else {

            // Income compared with essential expenses

            if (profile.monthlyBalance < 0) {

                alerts.push([
                    "warning",
                    `Your essential monthly expenses are ${formatMoney(Math.abs(profile.monthlyBalance))} higher than your monthly income. Review your expense categories in Money Planner.`
                ]);

            }

            else {

                alerts.push([
                    "success",
                    `Your monthly income exceeds the essential expenses entered by ${formatMoney(profile.monthlyBalance)}, before your savings target.`
                ]);

            }


            // Savings target check

            if (profile.afterSavingsTarget < 0) {

                alerts.push([
                    "warning",
                    `Your monthly savings target is ${formatMoney(Math.abs(profile.afterSavingsTarget))} higher than the amount left after essentials. Consider adjusting the target.`
                ]);

            }


            // Available money check

            const available =
                profile.availableBeforeTrackedSpending;


            if (available <= 0) {

                alerts.push([
                    "warning",
                    "You have no money available outside reserved savings. Consider upcoming essentials before making purchases."
                ]);

            }

            else if (monthTotal >= available * 0.8) {

                alerts.push([
                    "warning",
                    "Your tracked expenses have used at least 80% of the amount entered as available outside savings. Check what still needs to be covered."
                ]);

            }

            else {

                alerts.push([
                    "success",
                    "Your tracked expenses are currently below 80% of your available spending amount."
                ]);

            }


            // Zero-income situation

            if (
                profile.monthlyIncome === 0 &&
                available > 0
            ) {

                alerts.push([
                    "info",
                    "You entered zero monthly income, but you still have money outside reserved savings. Your daily guide helps you manage those existing funds."
                ]);

            }


            // Goal timeline

            if (
                profile.goalActive &&
                profile.goalMonths !== null
            ) {

                alerts.push([
                    "info",
                    `Your goal, ${profile.goalName}, is estimated to take about ${profile.goalMonths} months at your current monthly savings target.`
                ]);

            }

        }


        if (monthExpenses.length === 0) {

            alerts.push([
                "info",
                "No expenses have been tracked this month yet. Add them as you go to build a clearer picture."
            ]);

        }


        const container = $("alertsContainer");

        container.replaceChildren();


        alerts.forEach(([type, message]) => {

            const item = document.createElement("div");

            item.className = `alert ${type}`;

            item.textContent = message;

            container.appendChild(item);

        });

    }


    // =====================================================
    // 8. RECENT EXPENSES
    // =====================================================

    function renderRecentExpenses(expenses) {

        const container = $("recentExpenses");

        const recent = [...expenses]
            .sort(
                (a, b) =>
                    new Date(b.date).getTime() -
                    new Date(a.date).getTime()
            )
            .slice(0, 6);


        container.replaceChildren();


        if (recent.length === 0) {

            const empty = document.createElement("p");

            empty.className = "empty-state";

            empty.textContent =
                "No expenses recorded yet. Add your first expense above.";

            container.appendChild(empty);

            return;

        }


        recent.forEach(expense => {

            const row = document.createElement("div");

            row.className = "expense-row";


            const nameBlock = document.createElement("div");

            nameBlock.className = "expense-row-name";


            const name = document.createElement("strong");

            name.textContent = expense.name || "Expense";


            const date = document.createElement("small");

            date.textContent =
                new Date(expense.date).toLocaleDateString(
                    "en-IN",
                    {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                    }
                );


            nameBlock.append(name, date);


            const category = document.createElement("span");

            category.className = "expense-row-category";

            const categoryName = String(expense.category || "other");

            category.textContent =
                categoryName.charAt(0).toUpperCase() +
                categoryName.slice(1);


            const amount = document.createElement("strong");

            amount.className = "expense-row-amount";

            amount.textContent =
                `− ${formatMoney(expense.amount)}`;


            row.append(nameBlock, category, amount);

            container.appendChild(row);

        });

    }


    // =====================================================
    // 9. DASHBOARD REFRESH
    // =====================================================

    function refreshDashboard() {

        const profile = getProfileNumbers(readProfile());

        const allExpenses = readExpenses();

        const monthExpenses =
            getCurrentMonthExpenses(allExpenses);

        const monthTotal =
            getExpenseTotal(monthExpenses);


        renderSummary(profile, monthExpenses);

        renderSpending(monthExpenses);

        renderGoal(profile);

        renderAlerts(profile, monthExpenses, monthTotal);

        renderRecentExpenses(allExpenses);

    }


    // =====================================================
    // 10. STATUS MESSAGE
    // =====================================================

    function showMessage(message, isError = false) {

        const element = $("message");

        element.textContent = message;

        element.classList.toggle("error", isError);

    }


    // =====================================================
    // 11. ADD EXPENSE
    // =====================================================

    function handleExpenseSubmit(event) {

        event.preventDefault();


        const name = $("expenseName").value.trim();

        const amount = Number(
            $("expenseAmount").value
        );

        const category =
            $("expenseCategory").value;


        if (!name) {

            showMessage(
                "Enter a name for this expense.",
                true
            );

            $("expenseName").focus();

            return;

        }


        if (!Number.isFinite(amount) || amount <= 0) {

            showMessage(
                "Enter an amount greater than zero.",
                true
            );

            $("expenseAmount").focus();

            return;

        }


        const allowedCategories = [
            "food",
            "transport",
            "shopping",
            "entertainment",
            "other"
        ];


        if (!allowedCategories.includes(category)) {

            showMessage(
                "Choose a valid expense category.",
                true
            );

            return;

        }


        const expenses = readExpenses();


        const newExpense = {

            id: window.crypto?.randomUUID
                ? window.crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`,

            name,

            amount,

            category,

            date: new Date().toISOString()

        };


        expenses.push(newExpense);


        if (saveExpenses(expenses)) {

            $("expenseForm").reset();

            showMessage(
                "Expense added. Your Dashboard has been updated."
            );

            refreshDashboard();

        }

    }


    // =====================================================
    // 12. CLEAR EXPENSES
    // =====================================================

    function handleClearExpenses() {

        const expenses = readExpenses();


        if (expenses.length === 0) {

            showMessage(
                "There are no tracked expenses to clear."
            );

            return;

        }


        const confirmed = window.confirm(
            "Clear all expenses tracked on this Dashboard? Your Money Planner profile will remain unchanged."
        );


        if (!confirmed) return;


        if (saveExpenses([])) {

            showMessage(
                "Tracked expenses cleared. Your financial profile is unchanged."
            );

            refreshDashboard();

        }

    }


    // =====================================================
    // 13. INITIALIZE DASHBOARD
    // =====================================================

    function initDashboard() {

        const expenseForm = $("expenseForm");

        const clearButton = $("clearExpensesBtn");


        if (!expenseForm || !clearButton) {

            console.error(
                "Dashboard initialization failed. Check the HTML element IDs."
            );

            return;

        }


        expenseForm.addEventListener(
            "submit",
            handleExpenseSubmit
        );


        clearButton.addEventListener(
            "click",
            handleClearExpenses
        );


        refreshDashboard();

    }


    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initDashboard
        );

    }

    else {

        initDashboard();

    }


    // =====================================================
    // 14. LISTEN FOR PLANNER UPDATES
    // =====================================================

    window.addEventListener("storage", event => {

        if (
            event.key === PROFILE_KEY ||
            event.key === EXPENSES_KEY
        ) {

            refreshDashboard();

        }

    });

})();