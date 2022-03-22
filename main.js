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
                token_address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
                symbol: '*USDC',
                balance: 1000000000,
                decimals: 6,
            },
            {
                token_address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
                symbol: '*ETH',
                balance: 1500000000000000,
                decimals: 18,
            },
            {
                token_address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
                symbol: '*LINK',
                balance: 150000000000000,
                decimals: 18,
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
                        class="js-swap btn btn-success"
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

const getQuote = async (fromAmount) => {
    const fromTokenAddress = $selectedToken.dataset.address;
    const fromTokenDecimal = $selectedToken.dataset.decimals;
    const [toTokenAddress, toTokenDecimals] = $tokenSelector.value.split('-');

    const amountInWei = Moralis.Units.Token(fromAmount, fromTokenDecimal);

    try {
        const quote = await Moralis.Plugins.oneInch.quote({
            chain: 'polygon', // The blockchain you want to use (eth/bsc/polygon)
            fromTokenAddress, // The token you want to swap
            toTokenAddress, // The token you want to receive
            amount: amountInWei,
        });

        const toAmount = Moralis.Units.FromWei(
            quote.toTokenAmount,
            toTokenDecimals
        );
        $quoteContainer.innerHTML = `
            <p>
                ${fromAmount} ${quote.fromToken.symbol} = ${toAmount} ${quote.toToken.symbol}
            </p>
            <p>
                Gas fee: ${quote.estimatedGas}
            </p>
        `;
    } catch (error) {
        $quoteContainer.innerHTML = `<p class"error">The conversion did not succeed.</p>`;
    }
};

const formSubmit = (e) => {
    e.preventDefault();

    $amountError.innerText = '';

    const fromAmount = Number.parseFloat($amountInput.value);
    const fromMax = Number.parseFloat($selectedToken.dataset.max);

    if (Number.isNaN(fromAmount) || fromAmount > fromMax) {
        // invalid input
        $amountError.innerText = 'Invalid amount';
        return;
    }

    getQuote(fromAmount);
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
    const tokens = await Moralis.Plugins.oneInch.getSupportedTokens({
        chain: 'polygon',
    });
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

Moralis.initPlugins().then(() => {
    console.log('Plugins have been initialized');
    getTop10Tokens().then(getTicketData).then(renderTokenDropDown);
});
