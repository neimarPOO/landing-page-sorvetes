document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const responseMessage = document.getElementById('responseMessage');
    const submitBtn = e.target.querySelector('.submit-btn');

    // Simple loading state
    submitBtn.innerText = 'ENVIANDO...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        responseMessage.classList.remove('hidden', 'success', 'error');
        if (response.ok) {
            responseMessage.innerText = result.message;
            responseMessage.classList.add('success');
            e.target.reset();
        } else {
            responseMessage.innerText = result.error || 'Erro na inscrição.';
            responseMessage.classList.add('error');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        responseMessage.classList.remove('hidden', 'success', 'error');
        responseMessage.innerText = 'Erro ao conectar com o servidor.';
        responseMessage.classList.add('error');
    } finally {
        submitBtn.innerText = 'ENVIAR INSCRIÇÃO';
        submitBtn.disabled = false;
        responseMessage.scrollIntoView({ behavior: 'smooth' });
    }
});
