package com.neyqo.android.ui.accounts

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.neyqo.android.data.model.Account
import com.neyqo.android.data.model.CreateAccountPayload
import com.neyqo.android.data.repository.AccountRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AccountsUiState(
    val accounts: List<Account> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
    val showCreateSheet: Boolean = false,
    val editingAccount: Account? = null,
    val isSaving: Boolean = false,
    val saveError: String? = null,
)

class AccountsViewModel : ViewModel() {

    private val repository = AccountRepository()

    private val _uiState = MutableStateFlow(AccountsUiState())
    val uiState: StateFlow<AccountsUiState> = _uiState.asStateFlow()

    val totalBalance: Double
        get() = _uiState.value.accounts.sumOf { it.currentBalance }

    val activeCount: Int
        get() = _uiState.value.accounts.count { it.status == "active" }

    init {
        loadAccounts()
    }

    fun loadAccounts() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            repository.getAccounts()
                .onSuccess { accounts ->
                    _uiState.update {
                        it.copy(accounts = accounts, isLoading = false)
                    }
                }
                .onFailure { e ->
                    _uiState.update {
                        it.copy(error = e.message, isLoading = false)
                    }
                }
        }
    }

    fun openCreateSheet() {
        _uiState.update {
            it.copy(showCreateSheet = true, editingAccount = null, saveError = null)
        }
    }

    fun openEditSheet(account: Account) {
        _uiState.update {
            it.copy(showCreateSheet = true, editingAccount = account, saveError = null)
        }
    }

    fun closeSheet() {
        _uiState.update {
            it.copy(showCreateSheet = false, editingAccount = null, saveError = null)
        }
    }

    fun saveAccount(payload: CreateAccountPayload) {
        val editing = _uiState.value.editingAccount
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, saveError = null) }
            val result = if (editing != null) {
                repository.updateAccount(editing.id, payload)
            } else {
                repository.createAccount(payload)
            }
            result.onSuccess {
                _uiState.update {
                    it.copy(isSaving = false, showCreateSheet = false, editingAccount = null)
                }
                loadAccounts()
            }.onFailure { e ->
                _uiState.update {
                    it.copy(isSaving = false, saveError = e.message)
                }
            }
        }
    }

    fun deactivateAccount(id: String) {
        viewModelScope.launch {
            repository.deactivateAccount(id)
            loadAccounts()
        }
    }

    fun reactivateAccount(id: String) {
        viewModelScope.launch {
            repository.reactivateAccount(id)
            loadAccounts()
        }
    }
}
