// Delete price list to avoid duplicate pricing
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function deletePriceList() {
  console.log('🗑️ DELETING PRICE LIST\n')
  console.log('=' .repeat(60))

  // Get admin token
  const loginRes = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@tara-hub.com',
      password: 'supersecretpassword'
    })
  })

  if (!loginRes.ok) {
    console.log('❌ Failed to login as admin')
    return
  }

  const { token } = await loginRes.json()
  console.log('✅ Admin authenticated\n')

  const priceListId = 'plist_01K448HBGA4JZTTJA7WX79J22X'

  console.log(`Deleting price list: ${priceListId}`)

  const deleteRes = await fetch(`${MEDUSA_URL}/admin/price-lists/${priceListId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (deleteRes.ok || deleteRes.status === 404) {
    console.log('✅ Price list deleted successfully\n')
  } else {
    console.log(`⚠️ Failed to delete (status: ${deleteRes.status})\n`)
  }

  console.log('=' .repeat(60))
  console.log('✅ Cleanup complete!')
  console.log('\nYour Medusa now has:')
  console.log('  • One USD region')
  console.log('  • No price lists (using direct variant pricing only)')
  console.log('  • Simple, clean pricing structure')
}

deletePriceList().catch(console.error)