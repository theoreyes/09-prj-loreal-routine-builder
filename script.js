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
  // Wipes existing selectedItems array
  selectedItems = [];

  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
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
    saveSelectionsToStorage(); // Saves now modified selection list to storage
  } else {
    selectedItems.push(itemName);
    addToSelectedProducts(itemName);
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
  removeItem.innerText = "X";
  removeItem.addEventListener("click", () => {
    removeFromSelectedProducts(itemName);
  });
  itemDiv.appendChild(pItem);
  itemDiv.appendChild(removeItem);
  selectedProdList.appendChild(itemDiv);
}

function removeFromSelectedProducts(itemName) {
  document
    .getElementById("selectedProductsList")
    .querySelector(`#${itemName.replaceAll(" ", "").replaceAll("&", "")}`)
    .remove();
  selectedItems = selectedItems.filter((item) => item !== itemName);
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

function clearSelectedProducts() {
  document.getElementById("selectedProductsList").innerHTML = "";
  localStorage.removeItem("itemList");
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
  alertP.innerText = "Select at least one item to generate a routine";
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

  selectedItems = [];
  clearSelectedProducts();
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

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInputElement = document.querySelector("#userInput");
  let prompt = userInputElement.value.trim();
  messages.push({ role: "user", content: prompt });
  userInputElement.value = "";

  try {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages }),
    });
    if (!response.ok) throw new error(`HTTP Error! status: ${response.status}`);
    const result = await response.json();
    console.log(result);
  } catch (error) {
    console.error(`ERROR: ${error}`);
    displayReply("Error occurred! Please try again later");
  }
});

// TODO: Ensure user cant activate this unless at least one item is selected
generateRoutineBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  if (selectedItems.length === 0) {
    console.log("No items selected");
    if (!document.getElementById("alert-div")) {
      displaySelectItemsAlert(); // Lets user know to pick some items for a routine to generate
    }
  } else {
    let prompt = `$$GENERATE ROUTINE$$ ${JSON.stringify(selectedItems)}`;
    messages.push({ role: "user", content: prompt });
    try {
      const response = await fetch(workerURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages }),
      });
      if (!response.ok)
        throw new error(`HTTP Error! status: ${response.status}`);
      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error(`ERROR: ${error}`);
      displayReply("Error occurred! Please try again later");
    }
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  await loadCategoryFromStorage();
  loadSelectionsFromStorage();
});
