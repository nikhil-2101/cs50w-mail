document.addEventListener('DOMContentLoaded', function() {
  
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => loadMailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => loadMailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => loadMailbox('archive'));
  document.querySelector('#compose').addEventListener('click', composeEmail);
  document.querySelector('#compose-view').addEventListener('submit', sendEmail);


  // By default, load the inbox
  loadMailbox('inbox');
});

function composeEmail() {
  showView('compose-view');
  clearCompositionFields();
}

function viewEmail(id, mailbox) {
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      console.log(email); 

      showView('email-detail-view');
      displayEmailDetails(email);

      if (!email.read) {
        markAsRead(email.id);
      }

      addReplyButton(email);

      if (mailbox === 'inbox' || mailbox === 'archive') {
        addArchiveButton(email, mailbox);
      }
    });
}

function loadMailbox(mailbox) {
  // Show the emails view and set the mailbox name
  showView('emails-view');
  
  // Set the mailbox header
  const emailsView = document.querySelector('#emails-view');
  const capitalizedMailbox = mailbox.charAt(0).toUpperCase() + mailbox.slice(1);
  emailsView.innerHTML = `<h3>${capitalizedMailbox}</h3>`;

  // Clear the emails container but keep the header
  const emailsContainer = document.createElement('div');
  emailsContainer.id = 'emails-container';
  emailsView.appendChild(emailsContainer);

  // Fetch and display the emails
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      emails.forEach(email => {
        const emailBox = createEmailBox(email, mailbox);
        emailsContainer.appendChild(emailBox);
      });
    })
    .catch(error => {
      console.error('Error loading emails:', error);
    });
}


function sendEmail(event) {
  event.preventDefault();

  const recipient = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipients: recipient,
      subject: subject,
      body: body,
    }),
  })
  .then(response => {
    if (response.ok) {
      console.log('Email sent successfully');
      loadMailbox('sent'); 
    } else {
      console.error('Failed to send email');
    }
  })
  .catch(error => {
    console.error('Error sending email:', error);
  });
}

function showView(viewId) {
  const views = ['#emails-view', '#compose-view', '#email-detail-view'];
  views.forEach(view => {
    if (view === `#${viewId}`) {
      document.querySelector(view).style.display = 'block';
    } else {
      document.querySelector(view).style.display = 'none';
    }
  });
}

function clearCompositionFields() {
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function markAsRead(emailId) {
  fetch(`/emails/${emailId}`, {
    method: 'PUT',
    body: JSON.stringify({ read: true })
  })
  .then(response => {
    if (response.ok) {
      console.log(`Email ${emailId} marked as read successfully.`);
    } else {
      console.error(`Failed to mark email ${emailId} as read.`);
    }
  })
  .catch(error => {
    console.error('Error marking email as read:', error);
  });
}

function addReplyButton(email) {
  const btnReply = createButton('Reply', 'btn btn-info', () => {
    composeEmail();
    document.querySelector('#compose-recipients').value = email.sender;
    const subject = email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`;
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
  });
  document.querySelector('#email-detail-view').appendChild(btnReply);
}

function addArchiveButton(email, mailbox) {
  if (mailbox === 'sent') {
    return; 
  }

  const btnArch = createButton(email.archived ? 'Unarchive' : 'Archive', email.archived ? 'btn btn-success' : 'btn btn-danger', () => {
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({ archived: !email.archived })
    })
    .then(response => {
      if (response.ok) {
        loadMailbox('archive'); 
      } else {
        console.error('Failed to archive/unarchive email.');
      }
    })
    .catch(error => {
      console.error('Error archiving/unarchiving email:', error);
    });
  });
  document.querySelector('#email-detail-view').appendChild(btnArch);
}

function createButton(text, className, onClick) {
  const btn = document.createElement('button');
  btn.innerHTML = text;
  btn.className = className;
  btn.style.backgroundColor = 'white';
  btn.style.color = 'black';
  btn.addEventListener('click', onClick);
  return btn;
}

function createEmailBox(email, mailbox) {
  const emailContainer = document.createElement('div');
  emailContainer.className = 'email-container'; 

  const emailBox = document.createElement('div');
  emailBox.className = 'email-box';
  emailBox.innerHTML = `<p>${email.recipients} | ${email.subject} | ${email.timestamp}</p>`;
  emailBox.addEventListener('click', () => {
    viewEmail(email.id, mailbox); 

    emailContainer.classList.add('email-read');
  });

  emailContainer.appendChild(emailBox);

  if (mailbox === 'sent' || mailbox === 'archive' || email.read) {
    emailContainer.classList.add('email-read'); 
  } else {
    emailContainer.classList.remove('email-read'); 
  }

  return emailContainer;
}

function displayEmailDetails(email) {
  const emailDetailHTML = `
    <strong>From:</strong> <span class="text-color-white">${email.sender}</span><br>
    <strong>To:</strong> <span class="text-color-white">${email.recipients}</span><br>
    <strong>Subject:</strong> <span class="text-color-white">${email.subject}</span><br>
    <strong>Timestamp:</strong> <span class="text-color-white">${email.timestamp}</span><br><br>
    <div class="text-color-white">${email.body}</div><br><br>
  `;
  document.querySelector('#email-detail-view').innerHTML = emailDetailHTML;
}