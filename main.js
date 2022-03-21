/* Moralis init code */
Moralis.start({ serverUrl, appId });

const $balanceTable = document.querySelector('.js-token-balances');
const $selectedToken = document.querySelector('.js-form-token');
const $amountInput = document.querySelector('.js-form-amount');
const $submitButton = document.querySelector('.js-submit');
const $cancelButton = document.querySelector('.js-cancel');
const $quoteContainer = document.querySelector('.js-quote-container');

const wrapTag = (tag, content) => `<${tag}>${content}</${tag}>`;

const initSwapForm = (e) => {
    e.preventDefault();
    const { symbol, address, decimals, max } = e.target.dataset;

    $selectedToken.innerText = symbol;
    $selectedToken.dataset.address = address;
    $selectedToken.dataset.decimals = decimals;
    $selectedToken.dataset.max = max;

    $amountInput.value = '';
    $amountInput.removeAttribute('disabled');
    $submitButton.removeAttribute('disabled');
    $cancelButton.removeAttribute('disabled');
    $quoteContainer.innerHTML = ''
};

const getStats = async () => {
    const options = { chain: 'polygon' };
    let balances = await Moralis.Web3API.account.getTokenBalances(options);
    if (balances.length == 0) {
        balances = [
            { symbol: '*USDC', balance: 10000, decimals: 2 },
            { symbol: '*DAI', balance: 15000, decimals: 2 },
        ];
    }

    $balanceTable.innerHTML = balances
        .map(
            (t, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${t.symbol}</td>
                <td>${Moralis.Units.FromWei(t.balance, t.decimals)}</td>
                <td>
                    <button
                        class="js-swap"
                        data-address="${t.token_address}"
                        data-symbol="${t.symbol}"
                        data-decimals="${t.decimals}"
                        data-max="${Moralis.Units.FromWei(
                            t.balance,
                            t.decimals
                        )}"
                    >
                        Swap
                    </button>
                </td>
              </tr>
            `
        )
        .join('');

    for (let $btn of document.querySelectorAll('.js-swap')) {
        $btn.addEventListener('click', initSwapForm);
    }
};

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
                getStats();
            })
            .catch(function (error) {
                console.log(error);
            });
    } else {
        console.log('logged in user:', user);
        console.log(user.get('ethAddress'));
        getStats();
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
