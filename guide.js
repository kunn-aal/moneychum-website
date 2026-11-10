// MONEYCHUM FINANCIAL GUIDE
// JavaScript makes the small quiz interactive.

// Find all answer buttons on the page.
const answerButtons = document.querySelectorAll(".quiz-option");

// Find the place where we show the result.
const feedback = document.getElementById("quiz-feedback");

// Run this code when a student clicks an answer.
answerButtons.forEach(function(button) {
    button.addEventListener("click", function() {

        // Remove old answer colours.
        answerButtons.forEach(function(item) {
            item.classList.remove("correct", "wrong");
        });

        // Check whether the selected answer is correct.
        if (button.dataset.answer === "correct") {
            button.classList.add("correct");
            feedback.textContent = "Correct! Never share your UPI PIN or OTP.";
            feedback.style.color = "#16875c";
        } else {
            button.classList.add("wrong");
            feedback.textContent = "Not quite. Your UPI PIN and OTP must always stay private.";
            feedback.style.color = "#b44d40";
        }
    });
});
