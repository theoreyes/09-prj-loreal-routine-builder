/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const generateRoutineBtn = document.getElementById("generateRoutine");
const workerURL =
  "https://loreal-chatbot-worker.theodore-anthony-reyes.workers.dev/";
let selectedItems = [];
let category = "";

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  console.log("This ran");
  // Wipes existing selectedItems array
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <div class="desc-wrapper">
        <p class="product-description">${product.description}</p>
      </div>
    </div>
  `
    )
    .join("");
  const productArray = Array.from(productsContainer.children);
  // Adds ID's so that each item div can be accessed
  productArray.forEach((item) => {
    item.id =
      item.querySelector("img").alt.replaceAll(" ", "").replaceAll("&", "") +
      "Card";
    // Updates highlights for any items that have been selected
    updateActivation(`${item.querySelector("img").alt}`);
    console.log("updateActivation ran");
  });

  // Adds event listeners to each product on page
  productArray.forEach((item) =>
    item.addEventListener("click", () => {
      toggleItem(item);
    })
  );
}

/* Toggles item in product container */
function toggleItem(item) {
  clearAlert();
  const itemName = item.querySelector("img").alt;
  if (selectedItems.includes(itemName)) {
    selectedItems = selectedItems.filter((item) => item !== itemName);
    removeFromSelectedProducts(itemName);
    updateActivation(itemName);
    saveSelectionsToStorage(); // Saves now modified selection list to storage
  } else {
    selectedItems.push(itemName);
    addToSelectedProducts(itemName);
    updateActivation(itemName);
    saveSelectionsToStorage(); // Saves now modified selection list to storage
  }
}

function addToSelectedProducts(itemName) {
  const selectedProdList = document.getElementById("selectedProductsList");
  const itemDiv = document.createElement("div");
  itemDiv.classList = "selectedItemContainer";
  itemDiv.id = itemName.replaceAll(" ", "").replaceAll("&", "");
  const pItem = document.createElement("p");
  pItem.classList.add("selectedItem");
  pItem.innerText = itemName;
  const removeItem = document.createElement("p");
  removeItem.classList.add("removeItemBtn");
  removeItem.innerHTML = "&nbsp;X&nbsp;";
  removeItem.addEventListener("click", () => {
    removeFromSelectedProducts(itemName);
  });
  itemDiv.appendChild(removeItem);
  itemDiv.appendChild(pItem);
  selectedProdList.appendChild(itemDiv);
}

function removeFromSelectedProducts(itemName) {
  document
    .getElementById("selectedProductsList")
    .querySelector(`#${itemName.replaceAll(" ", "").replaceAll("&", "")}`)
    .remove();
  selectedItems = selectedItems.filter((item) => item !== itemName);
  updateActivation(itemName);
  saveSelectionsToStorage();
}

/* Saves the currently selected items as JSON in localStorage */
function saveSelectionsToStorage() {
  localStorage.setItem("itemList", JSON.stringify(selectedItems));
}

function loadSelectionsFromStorage() {
  const itemList = JSON.parse(localStorage.getItem("itemList"));
  if (itemList) {
    selectedItems = itemList;
    selectedItems.forEach((item) => {
      addToSelectedProducts(item);
      updateActivation(item);
    });
  }
}

function saveCategoryToStorage() {
  localStorage.setItem("selectedCategory", category);
}

/* Loads and displays selected category from localStorage if present */
async function loadCategoryFromStorage() {
  const tmpCategory = localStorage.getItem("selectedCategory");
  if (tmpCategory) {
    category = tmpCategory;
    const products = await loadProducts();
    const filteredProducts = products.filter(
      (product) => product.category === category
    );
    // Re-selects correct button dropwdown
    categoryFilter.value = category;
    displayProducts(filteredProducts);
  }
}

function clearAlert() {
  if (document.getElementById("alert-div"))
    document.getElementById("alert-div").remove();
}

function displaySelectItemsAlert() {
  const alertDiv = document.createElement("div");
  alertDiv.id = "alert-div";
  const alertP = document.createElement("p");
  alertP.id = "alert-div";
  alertP.innerText = "Please select at least one item to generate a routine";
  alertDiv.appendChild(alertP);
  document
    .getElementById("selected-products-container")
    .insertBefore(alertDiv, document.getElementById("generateRoutine"));
  setTimeout(() => {
    // Removes the alert after some time has passed
    clearAlert();
  }, 7000);
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  category = selectedCategory;
  saveCategoryToStorage();
  displayProducts(filteredProducts);
});

let messages = [
  {
    role: "system",
    content: `You are a L'Oreal branded chatbot designed to help customers navigate L'Oreal's extensive
    product catalog and provide tailored recommendations based on client input. Provide responses in a
    fun, professional manner, using emojis when it enhances the response. Make responses easy to understand
    and do not go into excessive detail unless specifically asked to. When a prompt begins with a list of products,
    consider these items as context, using them to inform your response to the user input. They may be formatted oddly,
    so do not re-type them in your response. When a message begins with the special string $$GENERATE ROUTINE$$, respond
    to this with a curated routine for the user based off of the selected list of items.

    Try to break apart long paragraphs into bullet points when necessary.
    
    Importantly, if user input is not related to beauty products, skincare, routines, recommendations, or beauty-related topics,
    then politely tell the user that you can not help them with that, but that you are ready to answer beauty-product-related
    questions or other questions regarding L'Oreal products. If user input not related to beauty products, then do not directly
    acknowledge whatever subject matter or content was entered in the user input.`,
  },
];

/*** Chat-bot functions & event-listeners ***/

const userInput = document.getElementById("userInput");

// Generate Routine
generateRoutineBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  if (selectedItems.length === 0) {
    if (!document.getElementById("alert-div")) {
      displaySelectItemsAlert(); // Lets user know to pick some items for a routine to generate
    }
  } else {
    let prompt = `$$GENERATE ROUTINE$$ ${JSON.stringify(selectedItems)}`;
    messages.push({ role: "user", content: prompt });
    displayPrompt("Generate me a routine from the items I selected!");
    displayGeneratingRoutine();

    try {
      const response = await fetch(workerURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages }),
      });
      if (!response.ok)
        throw new error(`HTTP Error! status: ${response.status}`);

      // Gets message back, adds to chat history
      const result = await response.json();
      const outputText = result.choices[0].message.content;
      messages.push({ role: "assistant", content: outputText });

      removeThinking();
      displayReply(outputText);
    } catch (error) {
      console.error(`ERROR: ${error}`);
      displayReply("Error occurred! Please try again later");
    }
  }
});

/* Send chat */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInputElement = document.querySelector("#userInput");
  let prompt = userInputElement.value.trim();
  messages.push({ role: "user", content: prompt });

  // Displays prompt at this point, wipes input field
  displayPrompt(prompt);
  userInputElement.value = "";
  displayThinking();

  try {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages }),
    });
    if (!response.ok) throw new error(`HTTP Error! status: ${response.status}`);

    // Gets message back, adds to chat history
    const result = await response.json();
    const outputText = result.choices[0].message.content;
    messages.push({ role: "assistant", content: outputText });

    // Displays response from OpenAI
    removeThinking();
    displayReply(outputText);
  } catch (error) {
    console.error(`ERROR: ${error}`);
    displayReply("Error occurred! Please try again later");
  }
});

// Auto-scrolls the chat window down when next chat bubbles enter the window
function scrollUX() {
  setTimeout(() => {
    if (!latestPrompt) return;

    const containerTop = chatWindow.getBoundingClientRect().top;
    const elementTop = latestPrompt.getBoundingClientRect().top;

    const offset = elementTop - containerTop - 6;

    chatWindow.scrollTo({
      top: chatWindow.scrollTop + offset,
      behavior: "smooth",
    });
  }, 0);
}

// Displays "Thinking..."
function displayThinking(isRoutine) {
  const thinkingDiv = document.createElement("div");
  const thinkingText = document.createElement("p");
  thinkingDiv.id = "think-bubble";
  thinkingDiv.classList.add("reply-window");
  thinkingText.classList.add("reply-text");
  thinkingText.textContent = "Thinking...";
  thinkingDiv.appendChild(thinkingText);
  chatWindow.appendChild(thinkingDiv);
  scrollUX();
}

// Displays "Generating Routine..."
// Yes, this isn't DRY, but the deliverable is on-time :)
function displayGeneratingRoutine() {
  const thinkingDiv = document.createElement("div");
  const thinkingText = document.createElement("p");
  thinkingDiv.id = "think-bubble";
  thinkingDiv.classList.add("reply-window");
  thinkingText.classList.add("reply-text");
  thinkingText.textContent = "Generating Routine...";
  thinkingDiv.appendChild(thinkingText);
  chatWindow.appendChild(thinkingDiv);
  scrollUX();
}

// Removes the "Thinking..." text from chat box
function removeThinking() {
  let thinkBubble = document.getElementById("think-bubble").remove();
  if (thinkBubble) thinkBubble.remove();
}

// Takes prompt text and displays it inside chat window
function displayPrompt(text) {
  const promptDiv = document.createElement("div");
  latestPrompt = promptDiv;
  const promptText = document.createElement("p");
  promptDiv.classList.add("prompt-window");
  promptText.classList.add("prompt-text");
  promptText.textContent = text;
  promptDiv.appendChild(promptText);
  chatWindow.appendChild(promptDiv);
  scrollUX();
}

// Takes reply text from API call and displays it inside chat window
function displayReply(text) {
  const replyDiv = document.createElement("div");
  const replyText = document.createElement("p");
  replyDiv.classList.add("reply-window");
  replyText.classList.add("reply-text");
  replyText.innerHTML = marked.parse(text);
  replyDiv.appendChild(replyText);
  chatWindow.appendChild(replyDiv);
  scrollUX();
}

// Uses the standard alt text as arg
function updateActivation(itemName) {
  const itemDiv = document.getElementById(
    `${itemName.replaceAll(" ", "").replaceAll("&", "") + "Card"}`
  );
  if (itemDiv) {
    if (selectedItems.includes(itemName)) {
      itemDiv.classList.add("activated");
    } else {
      itemDiv.classList.remove("activated");
    }
  }
}

// Grabs any previously selected items and/or category
document.addEventListener("DOMContentLoaded", async () => {
  await loadCategoryFromStorage();
  loadSelectionsFromStorage();
});
