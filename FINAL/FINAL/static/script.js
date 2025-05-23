let draggedElement = null;

function initCoffeeMaker() {
    const ingredientDiv = document.getElementById('ingredients');
    ingredients.forEach(item => {
        const div = document.createElement('div');
        div.className = 'ingredient';
        div.draggable = true;
        div.ondragstart = (e) => e.dataTransfer.setData('text', item.name);

        div.innerHTML = `
            <div class="crop-box">
                <img src="${item.img}" alt="${item.name}" class="ingredient-img">
            </div>
        `;
        ingredientDiv.appendChild(div);
    });
    updateQuizButton();
    logUserAction('enter_page', 'coffeemaker');

    const savedRecipes = localStorage.getItem('unlockedRecipes');
    if (savedRecipes) {
        unlockedRecipes = JSON.parse(savedRecipes);
    }
}

function allowWorkspaceDrop(ev) {
    ev.preventDefault();
}

function dropToWorkspace(ev) {
    ev.preventDefault();
    const ingredientName = ev.dataTransfer.getData("text");
    const workspace = document.getElementById('workspace-items');

    const ingredient = ingredients.find(i => i.name === ingredientName) || recipes.find(r => r.name === ingredientName);
    if (!ingredient) return;

    const newDiv = document.createElement('div');
    newDiv.className = 'workspace-item';
    newDiv.dataset.name = ingredientName;
    newDiv.setAttribute("draggable", true);

    newDiv.innerHTML = `
        <div class="crop-box">
            <img src="${ingredient.img}" alt="${ingredient.name}" class="ingredient-img">
        </div>
    `;

    newDiv.addEventListener("dragstart", (e) => {
        draggedElement = newDiv;
        e.dataTransfer.effectAllowed = "move";
        setTimeout(() => newDiv.classList.add("dragging"), 0);
    });

    newDiv.addEventListener("dragend", () => {
        draggedElement = null;
        newDiv.classList.remove("dragging");
    });

    workspace.appendChild(newDiv);
    checkForRecipe();
}

function repositionInWorkspace(ev) {
    ev.preventDefault();
    const workspace = document.getElementById('workspace-items');
    if (draggedElement && workspace.contains(draggedElement)) {
        workspace.appendChild(draggedElement);
        draggedElement = null;
        if (document.querySelectorAll('.workspace-item').length >= 2) {
            checkForRecipe();
        }
    }
}

function checkForRecipe() {
    const workspaceItems = document.querySelectorAll('.workspace-item');
    const workspaceNames = Array.from(workspaceItems).map(el => el.dataset.name);

    for (let recipe of recipes) {
        const comboMatch = recipe.combo.every(c => workspaceNames.includes(c));
        const toolMatch = !recipe.tool || recipe.tool.every(t => workspaceNames.includes(t));

        if (comboMatch && toolMatch) {
            const allUsed = recipe.combo.concat(recipe.tool || []);
            for (let name of allUsed) {
                const el = Array.from(document.querySelectorAll('.workspace-item')).find(item => item.dataset.name === name);
                if (el) el.remove();
            }

            const resultDiv = document.createElement('div');
            resultDiv.className = 'workspace-item';
            resultDiv.dataset.name = recipe.name;
            resultDiv.setAttribute("draggable", true);

            resultDiv.innerHTML = `
                <div class="crop-box">
                    <img src="${recipe.img}" alt="${recipe.name}" class="ingredient-img">
                </div>
            `;

            resultDiv.addEventListener("dragstart", (e) => {
                draggedElement = resultDiv;
                e.dataTransfer.effectAllowed = "move";
                setTimeout(() => resultDiv.classList.add("dragging"), 0);
            });

            resultDiv.addEventListener("dragend", () => {
                draggedElement = null;
                resultDiv.classList.remove("dragging");
            });

            document.getElementById('workspace-items').appendChild(resultDiv);

            if (!recipe.isUnlocked) {
                recipe.isUnlocked = true;
                if (!unlockedRecipes.includes(recipe.name)) {
                    unlockedRecipes.push(recipe.name);
                    localStorage.setItem('unlockedRecipes', JSON.stringify(unlockedRecipes));
                    alert(`🎉 You unlocked a new drink: ${recipe.name}!`);
                    logUserAction('unlocked_recipe', recipe.name);
                }
            }

            updateQuizButton();
        }
    }
}

function clearWorkspace() {
    const workspace = document.getElementById('workspace-items');
    workspace.innerHTML = '';
}

function updateQuizButton() {
    const btn = document.getElementById('quiz-btn');
    if (unlockedRecipes.length >= 7) {
        btn.disabled = false;
        btn.innerText = "Quiz Me!";
    } else {
        btn.disabled = true;
        btn.innerText = `Unlock ${7 - unlockedRecipes.length} more to start quiz`;
    }
}

function logUserAction(action, details) {
    fetch('/log_action', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: action,
            details: details
        }),
    });
}

