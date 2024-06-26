// We can use this to wrap our asynchronous functions rather than using try/catch in every one
module.exports = func => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    }
}

// 'func' is what we pass in
// this returns a new function that has func executed
// and then catches any errors and passes them to next