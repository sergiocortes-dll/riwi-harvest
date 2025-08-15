function Home() {
    const [count, setCount] = Didact.useState(0);
    return Didact.createElement('div', null,
        Didact.createElement('h1', null, 'Bienvenido a Home'),
        Didact.createElement('p', null, `Contador: ${count}`),
        Didact.createElement('button', { onClick: () => setCount(c => c + 1) }, 'Incrementar')
    );
}