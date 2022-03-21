/* Moralis init code */
Moralis.start({ serverUrl, appId });

const $balanceTable = document.querySelector('.js-token-balances');
const $selectedToken = document.querySelector('.js-from-token');
const $amountInput = document.querySelector('.js-from-amount');
const $submitButton = document.querySelector('.js-submit');
const $cancelButton = document.querySelector('.js-cancel');
const $quoteContainer = document.querySelector('.js-quote-container');
const $tokenSelector = document.querySelector('[name=to-token]');
const $amountError = document.querySelector('.js-amount-error');

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
    $quoteContainer.innerHTML = '';
    $amountError.innerText = '';
};

const getStats = async () => {
    const options = { chain: 'polygon' };
    let balances = await Moralis.Web3API.account.getTokenBalances(options);
    if (balances.length == 0) {
        balances = [
            {
                token_address: 'aaaa',
                symbol: '*USDC',
                balance: 10000,
                decimals: 2,
            },
            {
                token_address: 'bbbb',
                symbol: '*DAI',
                balance: 15000,
                decimals: 2,
            },
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
document.getElementById('btn-login').onclick = login;

logOut = async () => {
    await Moralis.User.logOut();
    console.log('logged out');
};
document.getElementById('btn-logout').onclick = logOut;

// -------- action buttons --------

const formSubmit = (e) => {
    e.preventDefault();

    $amountError.innerText = '';

    const fromAmount = Number.parseFloat($amountInput.value);
    const fromMax = Number.parseFloat($selectedToken.dataset.max);

    if (Number.isNaN(fromAmount) || fromAmount > fromMax) {
        // invalid input
        $amountError.innerText = 'Invalid amount';
    }
};
$submitButton.onclick = formSubmit;

const formCancel = (e) => {
    e.preventDefault();

    $submitButton.setAttribute('disabled', '');
    $cancelButton.setAttribute('disabled', '');
    $amountInput.setAttribute('disabled', '');
    $amountInput.value = '';

    delete $selectedToken.innerText;
    delete $selectedToken.dataset.address;
    delete $selectedToken.dataset.decimals;
    delete $selectedToken.dataset.max;

    $quoteContainer.innerHTML = '';
    $amountError.innerText = '';
};
$cancelButton.onclick = formCancel;

// -------- initialization code ----------

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

const renderTokenDropDown = (tokens) => {
    const options = tokens
        .map(
            (t) => `
            <option value="${t.address}-${t.decimals}">
                ${t.name}
            </option>
            `
        )
        .join('');

    $tokenSelector.innerHTML = options;
};

getTop10Tokens().then(getTicketData).then(renderTokenDropDown);
