// Compatibility shim: re-export the implementations from paymentController_new.js
// The project routes import `paymentController.js` but the active file is
// `paymentController_new.js`. This shim avoids changing multiple imports.
export * from "./paymentController_new.js";
