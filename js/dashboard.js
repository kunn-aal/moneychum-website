// ======================================
// MONEYCHUM DASHBOARD
// ======================================

// Default financial information

const defaultData = {
    balance: 8500,
    income: 6000,
    expenses: 2500,
    savings: 2000,

    dailyTarget: 200,
    dailySpent: 0,

    goal: {
        name: "New Headphones",
        target: 10000,
        saved: 6000
    },

    categories: {
        food: 1000,
        transport: 500,
        shopping: 700,
        entertainment: 300
    }
};


// Load saved information

function loadData() {
    try {
        const saved = localStorage.getItem("moneychumDashboard");

        if (saved) {
            const parsed = JSON.parse(saved);

            if (
                parsed &&
                Number.isFinite(parsed.balance) &&
                parsed.balance >= 0 &&
                parsed.categories &&
                parsed.goal
            ) {
                return parsed;
            }
        }
    } catch (error) {
        console.log("Using default data.");
    }

    return JSON.parse(JSON.stringify(defaultData));
}

let data = loadData();


// Save information

function saveData() {
    localStorage.setItem(
        "moneychumDashboard",
        JSON.stringify(data)
    );
}


// Format Indian currency

function formatMoney(amount) {
    return "₹" + amount.toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}


// Update all dashboard elements

function updateDashboard() {

    document.getElementById("balance").textContent =
        formatMoney(data.balance);

    document.getElementById("income").textContent =
        formatMoney(data.income);

    document.getElementById("expenses").textContent =
        formatMoney(data.expenses);

    document.getElementById("savings").textContent =
        formatMoney(data.savings);


    // Daily guidance

    document.getElementById("dailyTarget").textContent =
        formatMoney(data.dailyTarget);

    document.getElementById("dailySpent").textContent =
        "Today's spending: " + formatMoney(data.dailySpent);

    const remaining = data.dailyTarget - data.dailySpent;

    document.getElementById("dailyRemaining").textContent =
        remaining >= 0
            ? formatMoney(remaining) + " remaining in your target."
            : formatMoney(-remaining) + " above your daily target.";


    // Spending breakdown

    const categories = [
        "food",
        "transport",
        "shopping",
        "entertainment"
    ];

    categories.forEach(category => {

        const amount = data.categories[category];

        document.getElementById(category + "Amount").textContent =
            formatMoney(amount);

        const percentage = data.expenses > 0
            ? amount / data.expenses * 100
            : 0;

        document.getElementById(category + "Bar").style.width =
            Math.min(percentage, 100) + "%";
    });


    // Savings goal

    const goal = data.goal;

    const percentage = goal.target > 0
        ? Math.min(goal.saved / goal.target * 100, 100)
        : 0;

    document.getElementById("goalName").textContent = goal.name;

    document.getElementById("goalDetails").textContent =
        formatMoney(goal.saved) + " saved out of " +
        formatMoney(goal.target);

    document.getElementById("goalPercentage").textContent =
        Math.round(percentage) + "%";

    document.getElementById("goalFill").style.width =
        percentage + "%";

    document.getElementById("goalRemaining").textContent =
        goal.saved >= goal.target
            ? "Congratulations! Goal completed."
            : formatMoney(goal.target - goal.saved) +
              " remaining to reach your goal.";


    // Financial observations

    const observations = document.getElementById("observations");

    observations.innerHTML = "";

    if (data.balance < data.dailyTarget * 3) {

        addObservation(
            "warning",
            "Your available balance is getting low. Be careful with non-essential purchases."
        );

    } else {

        addObservation(
            "success",
            "You have money available. Continue spending thoughtfully."
        );

    }

    if (data.dailySpent > data.dailyTarget) {

        addObservation(
            "warning",
            "You have crossed your daily spending target. Consider reducing optional expenses."
        );

    }

    if (data.expenses > data.income) {

        addObservation(
            "warning",
            "Your recorded monthly expenses are higher than your monthly income."
        );

    }

    if (data.goal.saved >= data.goal.target) {

        addObservation(
            "success",
            "Congratulations! You have reached your savings goal."
        );

    }

}


// Add an observation

function addObservation(type, message) {

    const div = document.createElement("div");

    div.className = "alert " + type;

    div.textContent = message;

    document.getElementById("observations").appendChild(div);

}


// Add expense functionality

document.getElementById("expenseForm")
.addEventListener("submit", function(event) {

    event.preventDefault();

    const amount = Number(
        document.getElementById("amount").value
    );

    const category =
        document.getElementById("category").value;

    const message = document.getElementById("message");


    // Validate amount

    if (!Number.isFinite(amount) || amount <= 0) {

        message.textContent = "Enter a valid expense amount.";

        message.className = "error";

        return;
    }


    // Prevent overspending

    if (amount > data.balance) {

        message.textContent =
            "Insufficient available balance for this expense.";

        message.className = "error";

        return;
    }


    // Update information

    data.balance -= amount;

    data.expenses += amount;

    data.dailySpent += amount;

    data.categories[category] += amount;


    // Save and display

    saveData();

    updateDashboard();

    message.textContent = "Expense added successfully!";

    message.className = "";

    this.reset();

});


// Reset dashboard

document.getElementById("resetButton")
.addEventListener("click", function() {

    const confirmReset = confirm(
        "Are you sure you want to restore the sample financial data?"
    );

    if (confirmReset) {

        data = JSON.parse(JSON.stringify(defaultData));

        saveData();

        updateDashboard();

        document.getElementById("message").textContent =
            "Sample data restored.";

    }

});


// Initial display

updateDashboard();
