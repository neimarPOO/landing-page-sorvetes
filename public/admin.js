let submissionsData = [];

document.getElementById('loginBtn').addEventListener('click', async () => {
    const password = document.getElementById('adminPassword').value;
    const errorMsg = document.getElementById('errorMsg');
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const submissionsBody = document.getElementById('submissionsBody');

    try {
        const response = await fetch('/api/admin/fetch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password }),
        });

        if (response.ok) {
            submissionsData = await response.json();

            // Render submissions
            submissionsBody.innerHTML = submissionsData.map(sub => `
                <tr>
                    <td>${new Date(sub.created_at).toLocaleDateString('pt-BR')}</td>
                    <td>${sub.nome}</td>
                    <td>${sub.email || '-'}</td>
                    <td>${sub.whatsapp || '-'}</td>
                    <td>${sub.idade || '-'}</td>
                    <td>${sub.bairro || '-'}</td>
                    <td>${sub.motivacao || '-'}</td>
                    <td>
                        <button onclick="editSubmission(${sub.id})" class="btn-action btn-edit">Editar</button>
                        <button onclick="deleteSubmission(${sub.id})" class="btn-action btn-delete">Excluir</button>
                    </td>
                </tr>
            `).join('');

            loginSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            sessionStorage.setItem('admin_session', password); // Temporary session
        } else {
            const result = await response.json();
            errorMsg.innerText = result.error || 'Senha incorreta.';
            errorMsg.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error:', error);
        errorMsg.innerText = 'Erro de conexão com o servidor.';
        errorMsg.classList.remove('hidden');
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('admin_session');
    location.reload();
});

// CRUD Logic
window.editSubmission = (id) => {
    const sub = submissionsData.find(s => s.id == id);
    if (!sub) return;

    document.getElementById('modalTitle').innerText = 'Editar Inscrição';
    document.getElementById('subId').value = sub.id;
    document.getElementById('subNome').value = sub.nome;
    document.getElementById('subEmail').value = sub.email || '';
    document.getElementById('subWhatsapp').value = sub.whatsapp || '';
    document.getElementById('subIdade').value = sub.idade || '';
    document.getElementById('subBairro').value = sub.bairro || '';
    document.getElementById('subMotivacao').value = sub.motivacao || '';

    document.getElementById('crudModal').classList.remove('hidden');
};

document.getElementById('newSubBtn').addEventListener('click', () => {
    document.getElementById('modalTitle').innerText = 'Nova Inscrição';
    document.getElementById('crudForm').reset();
    document.getElementById('subId').value = '';
    document.getElementById('crudModal').classList.remove('hidden');
});

document.getElementById('closeCrudModal').addEventListener('click', () => {
    document.getElementById('crudModal').classList.add('hidden');
});

document.getElementById('crudForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('subId').value;
    const password = sessionStorage.getItem('admin_session');

    const submission = {
        nome: document.getElementById('subNome').value,
        email: document.getElementById('subEmail').value,
        whatsapp: document.getElementById('subWhatsapp').value,
        idade: parseInt(document.getElementById('subIdade').value),
        bairro: document.getElementById('subBairro').value,
        motivacao: document.getElementById('subMotivacao').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/admin/submissions/${id}` : '/api/admin/submissions';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, submission })
        });

        if (response.ok) {
            alert('Sucesso!');
            document.getElementById('crudModal').classList.add('hidden');
            // Refresh data without full reload if possible, but location.reload is safer for consistency
            location.reload();
        } else {
            const err = await response.json();
            alert('Erro: ' + (err.error || 'Falha na operação'));
        }
    } catch (err) {
        alert('Erro de conexão');
    }
});

window.deleteSubmission = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta inscrição?')) return;

    const password = sessionStorage.getItem('admin_session');

    try {
        const response = await fetch(`/api/admin/submissions/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (response.ok) {
            alert('Excluído com sucesso!');
            location.reload();
        } else {
            const err = await response.json();
            alert('Erro ao excluir: ' + (err.error || 'Falha na operação'));
        }
    } catch (err) {
        alert('Erro de conexão');
    }
};

// CSV Export
document.getElementById('exportCsv').addEventListener('click', () => {
    if (!submissionsData.length) return alert('Nenhum dado para exportar.');

    const headers = ['Data', 'Nome', 'Email', 'WhatsApp', 'Idade', 'Bairro', 'Motivacao'];
    const rows = submissionsData.map(sub => [
        new Date(sub.created_at).toLocaleDateString('pt-BR'),
        sub.nome,
        sub.email || '',
        sub.whatsapp || '',
        sub.idade || '',
        sub.bairro || '',
        (sub.motivacao || '').replace(/\n/g, ' ')
    ]);

    let csvContent = "data:text/csv;charset=utf-8,"
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inscricoes_foodmakers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// PDF Export
document.getElementById('exportPdf').addEventListener('click', () => {
    if (!submissionsData.length) return alert('Nenhum dado para exportar.');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Inscrições FoodMakers - Sorvetes Sustentáveis", 14, 15);

    const tableColumn = ["Data", "Nome", "WhatsApp", "Idade", "Bairro"];
    const tableRows = submissionsData.map(sub => [
        new Date(sub.created_at).toLocaleDateString('pt-BR'),
        sub.nome,
        sub.whatsapp || '',
        sub.idade || '',
        sub.bairro || ''
    ]);

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 25,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] }
    });

    doc.save("inscricoes_foodmakers.pdf");
});

// Check session on load
window.addEventListener('load', () => {
    const savedPassword = sessionStorage.getItem('admin_session');
    if (savedPassword) {
        document.getElementById('adminPassword').value = savedPassword;
        document.getElementById('loginBtn').click();
    }
});
