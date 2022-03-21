/* Moralis init code */
Moralis.start({ serverUrl, appId });

/* Authentication code */
login = async () => {
    let user = Moralis.User.current();
    if (!user) {
        user = await Moralis.authenticate({
            signingMessage: 'Log in using Moralis',
        })
            .then(function (user) {
                console.log('logged in user:', user);
                console.log(user.get('ethAddress'));
            })
            .catch(function (error) {
                console.log(error);
            });
    }
};

logOut = async () => {
    await Moralis.User.logOut();
    console.log('logged out');
};

document.getElementById('btn-login').onclick = login;
document.getElementById('btn-logout').onclick = logOut;

const getTop10Tokens = async () => {
    const response = await fetch('https://api.coinpaprika.com/v1/coins');
    const tokens = await response.json();

    return tokens
        .filter((t) => t.rank >= 1 && t.rank <= 10)
        .map((t) => t.symbol);
};

const getTicketData = async (tickerList) => {
    const response = await fetch('https://api.1inch.exchange/v3.0/137/tokens');
    const tokens = await response.json();
    const tokenList = Object.values(tokens.tokens);

    return tokenList.filter((t) => tickerList.includes(t.symbol));
};

getTop10Tokens()
    .then(getTicketData)
    .then((r) => console.log(r));
